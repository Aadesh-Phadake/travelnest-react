const Listing = require('../models/listing');
const expressError = require('../utils/expressError');

module.exports.index = async (req, res) => {
    try {
        let { search, price, rating } = req.query;
        let filter = {};

        // Search Logic
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        // Price Filter Logic
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

        // Fetch and Filter
        let listings = await Listing.find(filter).populate('reviews');

        // Rating Filter (Done in memory because ratings are computed)
        if (rating) {
            listings = listings.filter(listing => {
                if (listing.reviews && listing.reviews.length > 0) {
                    const avgRating = listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length;
                    return avgRating >= parseInt(rating);
                }
                return false;
            });
        }

        res.status(200).json(listings);
    } catch (e) {
        res.status(500).json({ message: "Error fetching listings", error: e.message });
    }
};

module.exports.search = async (req, res) => {
    // Re-using the index logic for consistency, but returning the specific format you had
    // In a real API, you usually just use the index route with query params
    try {
        await module.exports.index(req, res);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

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
        await listing.save();
        
        console.log('Listing created successfully:', listing._id, 'License:', listing.hotelLicense ? 'Saved' : 'Not saved');
        
        res.status(201).json({ 
            message: 'Hotel listed successfully!', 
            listing 
        });
    } catch (e) {
        console.error('Error creating listing:', e);
        res.status(500).json({ message: "Error creating listing", error: e.message });
    }
};

module.exports.show = async (req, res) => {
    try {
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
            return res.status(410).json({ message: 'This hotel has been deleted due to inactivity.' });
        }

        if (req.user && listing.owner._id.equals(req.user._id)) {
            if (timeSinceLastUpdated >= (twoMonths - fiveDays)) {
                warningMessage = 'Your hotel will be deleted in less than 5 days due to inactivity!';
            }
        }
        // -----------------------------

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

        res.status(200).json({ 
            message: 'Hotel updated successfully!', 
            listing: updatedListing 
        });
    } catch (e) {
        console.error('Error updating listing:', e);
        res.status(500).json({ message: "Error updating listing", error: e.message });
    }
};

module.exports.delete = async (req, res) => {
    try {
        const deletedListing = await Listing.findByIdAndDelete(req.params.id);
        if (!deletedListing) return res.status(404).json({ message: "Listing not found" });
        
        res.status(200).json({ message: 'Hotel deleted successfully!' });
    } catch (e) {
        res.status(500).json({ message: "Error deleting listing", error: e.message });
    }
};

// Renamed from renderPayment to calculateBookingCosts
// React calls this to preview the price details
module.exports.renderPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests } = req.query;

        const listing = await Listing.findById(id);
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
                serviceFee = isActiveMember ? 0 : Math.round(baseAmount * 0.1);
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