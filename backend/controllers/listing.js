/**
 * Listing Controller
 * 
 * Handles all CRUD operations for hotel listings.
 * 
 * Optimizations:
 *   - Redis caching with cache-first strategy (TTL: 60s)
 *   - Cache invalidation on create/update/delete
 *   - .lean() for read-only queries (returns plain JS objects)
 *   - Pagination support (page, limit query params)
 *   - console.time() performance benchmarks
 *   - Dual-strategy search: regex for partial, $text for full-text
 */

const Listing = require('../models/listing');
const expressError = require('../utils/expressError');
const { getCache, setCache, invalidateCache, buildCacheKey } = require('../services/cacheService');

// ===== GET ALL LISTINGS (with search, filters, pagination, caching) =====
module.exports.index = async (req, res) => {
    try {
        console.time('⏱️ GET /listings');
        let { search, price, rating, page, limit } = req.query;

        // --- Cache-first strategy ---
        const cacheKey = buildCacheKey('listings', { search, price, rating, page, limit });
        const cached = await getCache(cacheKey);
        if (cached) {
            console.timeEnd('⏱️ GET /listings');
            return res.status(200).json(cached);
        }

        let filter = {};

        // --- Search Logic (dual-strategy) ---
        if (search) {
            if (search.length < 3) {
                // Short queries: use $regex for partial matching (e.g., "Del" → "Delhi")
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } }
                ];
            } else {
                // Longer queries: use MongoDB $text for relevance-scored full-text search
                filter.$text = { $search: search };
            }
        }

        // --- Price Filter Logic ---
        if (price) {
            if (price === '0-1000') {
                filter.price = { $lte: 1000 };
            } else if (price === '1000-2000') {
                filter.price = { $gt: 1000, $lte: 2000 };
            } else if (price === '2000-3000') {
                filter.price = { $gt: 2000, $lte: 3000 };
            } else if (price === '3000+') {
                filter.price = { $gt: 3000 };
            }
        }

        // --- Only show approved listings (backwards compatible) ---
        // When using $text search, we can't combine with another $or on the same level
        // that doesn't use $text, so we handle this differently.
        if (filter.$text) {
            // With $text, use $and to combine status filter
            filter.$and = [
                { $or: [{ status: { $exists: false } }, { status: 'approved' }] }
            ];
        } else if (filter.$or) {
            // Already have $or from search, combine with $and
            const searchOr = filter.$or;
            delete filter.$or;
            filter.$and = [
                { $or: searchOr },
                { $or: [{ status: { $exists: false } }, { status: 'approved' }] }
            ];
        } else {
            filter.$or = [
                { status: { $exists: false } },
                { status: 'approved' }
            ];
        }

        // --- Pagination ---
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * limitNum;

        // --- Build query with optimizations ---
        let query = Listing.find(filter);

        // Add text score sorting if using $text search
        if (filter.$text) {
            query = query.select({ score: { $meta: 'textScore' } })
                         .sort({ score: { $meta: 'textScore' } });
        }

        let listings = await query
            .populate('reviews')
            .skip(skip)
            .limit(limitNum)
            .lean(); // Returns plain JS objects — faster than Mongoose documents

        // --- Rating Filter (in-memory since ratings are computed averages) ---
        if (rating) {
            listings = listings.filter(listing => {
                if (listing.reviews && listing.reviews.length > 0) {
                    const avgRating = listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length;
                    return avgRating >= parseInt(rating);
                }
                return false;
            });
        }

        // Get total count for pagination metadata
        const totalCount = await Listing.countDocuments(filter);

        const response = {
            listings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum)
            }
        };

        // Cache the listings array (must match what we return to frontend)
        await setCache(cacheKey, listings, 60);

        console.timeEnd('⏱️ GET /listings');

        // Return just the listings array for backwards compatibility
        // (frontend expects an array directly)
        res.status(200).json(listings);
    } catch (e) {
        console.timeEnd('⏱️ GET /listings');
        res.status(500).json({ message: "Error fetching listings", error: e.message });
    }
};

// ===== SEARCH LISTINGS =====
module.exports.search = async (req, res) => {
    // Re-using the index logic for consistency
    try {
        await module.exports.index(req, res);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ===== CREATE LISTING =====
module.exports.create = async (req, res, next) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Send valid data.' });
        }
        
        console.log('Creating listing with data:', {
            title: req.body.title,
            hasHotelLicense: !!req.body.hotelLicense,
            hotelLicense: req.body.hotelLicense ? 'Present' : 'Missing'
        });
        
        const listing = new Listing(req.body);
        listing.owner = req.user._id;
        
        // Listings created by admins are auto-approved.
        // Everyone else (managers, etc.) must be approved by admin.
        if (req.user.role === 'admin') {
            listing.status = 'approved';
        } else {
            listing.status = 'pending';
        }
        await listing.save();
        
        console.log('Listing created successfully:', listing._id, 'License:', listing.hotelLicense ? 'Saved' : 'Not saved');

        // Invalidate listing caches since data changed
        await invalidateCache('listings:*');
        
        res.status(201).json({ 
            message: 'Hotel listed successfully!', 
            listing 
        });
    } catch (e) {
        console.error('Error creating listing:', e);
        res.status(500).json({ message: "Error creating listing", error: e.message });
    }
};

// ===== SHOW SINGLE LISTING =====
module.exports.show = async (req, res) => {
    try {
        console.time(`⏱️ GET /listings/${req.params.id}`);

        const { sortBy } = req.query;
        let sortOption = {};
        
        // Define sort options for reviews
        switch (sortBy) {
            case 'newest': sortOption = { createdAt: -1 }; break;
            case 'oldest': sortOption = { createdAt: 1 }; break;
            case 'highest': sortOption = { rating: -1 }; break;
            case 'lowest': sortOption = { rating: 1 }; break;
            default: sortOption = { createdAt: -1 };
        }
        
        const listing = await Listing.findById(req.params.id)
            .populate({ 
                path: 'reviews', 
                populate: { path: 'author', select: 'username' }, // Only fetch username
                options: { sort: sortOption }
            })
            .populate('owner', 'username email'); // Populate owner details

        if (!listing) {
            console.timeEnd(`⏱️ GET /listings/${req.params.id}`);
            return res.status(404).json({ message: 'Hotel not found!' });
        }

        // --- Inactivity Check Logic ---
        const now = new Date();
        const lastUpdated = new Date(listing.lastUpdated);
        const twoMonths = 2 * 30 * 24 * 60 * 60 * 1000;
        const fiveDays = 5 * 24 * 60 * 60 * 1000;
        const timeSinceLastUpdated = now - lastUpdated;
        
        let warningMessage = null;

        if (timeSinceLastUpdated >= twoMonths) {
            await Listing.findByIdAndDelete(req.params.id);
            // Invalidate caches
            await invalidateCache('listings:*');
            console.timeEnd(`⏱️ GET /listings/${req.params.id}`);
            return res.status(410).json({ message: 'This hotel has been deleted due to inactivity.' });
        }

        if (req.user && listing.owner._id.equals(req.user._id)) {
            if (timeSinceLastUpdated >= (twoMonths - fiveDays)) {
                warningMessage = 'Your hotel will be deleted in less than 5 days due to inactivity!';
            }
        }
        // -----------------------------

        console.timeEnd(`⏱️ GET /listings/${req.params.id}`);

        res.status(200).json({ 
            listing, 
            warningMessage,
            finalPrice: listing.price // You can add calculation logic here if needed
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the listing.' });
    }
};

// ===== UPDATE LISTING =====
module.exports.update = async (req, res, next) => {
    try {
        if (!req.body) return res.status(400).json({ message: 'Send valid data.' });
        
        console.log('Updating listing:', req.params.id, {
            hasHotelLicense: !!req.body.hotelLicense,
            hotelLicense: req.body.hotelLicense ? 'Present' : 'Missing'
        });
        
        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id, 
            { ...req.body, lastUpdated: Date.now() },
            { new: true } // Return the updated document
        );
        
        if (!updatedListing) return res.status(404).json({ message: "Listing not found" });

        console.log('Listing updated successfully. License:', updatedListing.hotelLicense ? 'Saved' : 'Not saved');

        // Invalidate listing caches since data changed
        await invalidateCache('listings:*');

        res.status(200).json({ 
            message: 'Hotel updated successfully!', 
            listing: updatedListing 
        });
    } catch (e) {
        console.error('Error updating listing:', e);
        res.status(500).json({ message: "Error updating listing", error: e.message });
    }
};

// ===== DELETE LISTING =====
module.exports.delete = async (req, res) => {
    try {
        const deletedListing = await Listing.findByIdAndDelete(req.params.id);
        if (!deletedListing) return res.status(404).json({ message: "Listing not found" });

        // Invalidate listing caches since data changed
        await invalidateCache('listings:*');
        
        res.status(200).json({ message: 'Hotel deleted successfully!' });
    } catch (e) {
        res.status(500).json({ message: "Error deleting listing", error: e.message });
    }
};

// ===== CALCULATE BOOKING COSTS =====
// React calls this to preview the price details
module.exports.renderPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests } = req.query;

        const listing = await Listing.findById(id).lean();
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            // Handle DD-MM-YYYY
            if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                const parts = dateStr.split('-');
                if (parts[0].length <= 2) {
                    const [day, month, year] = parts.map(Number);
                    const date = new Date(year, month - 1, day);
                    return isNaN(date.getTime()) ? null : date;
                }
            }
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        };

        const checkInDate = parseDate(checkIn);
        const checkOutDate = parseDate(checkOut);

        let nights = 0;
        let serviceFee = 0;
        let totalAmount = 0;
        let baseAmount = 0;
        let additionalGuestFee = 0;

        const numGuests = parseInt(guests) || 1;
        
        if (checkInDate && checkOutDate && !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
            nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            if (nights > 0) {
                baseAmount = listing.price * nights;
                
                if (numGuests > 2) {
                    additionalGuestFee = (numGuests - 2) * 500 * nights;
                    baseAmount += additionalGuestFee;
                }
                
                const isActiveMember = req.user && req.user.isMember && req.user.membershipExpiresAt && new Date(req.user.membershipExpiresAt) > new Date();
                serviceFee = isActiveMember ? 0 : Math.round(baseAmount * 0.05);
                totalAmount = baseAmount + serviceFee;
            }
        }

        res.status(200).json({
            listing,
            bookingDetails: {
                checkIn,
                checkOut,
                guests: numGuests,
                nights,
                pricePerNight: listing.price,
                baseAmount,
                additionalGuestFee,
                serviceFee,
                totalAmount
            }
        });
    } catch (e) {
        res.status(500).json({ message: "Error calculating price", error: e.message });
    }
};