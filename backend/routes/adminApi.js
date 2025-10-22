const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Listing = require('../models/listing');
const Booking = require('../models/booking');
const Review = require('../models/review');
const ContactMessage = require('../models/contactMessage');
const { isLoggedIn } = require('../middleware');

// Helper function to get week number that matches MongoDB $week operator
function getMongoWeek(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    const startOfYearDay = startOfYear.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // MongoDB $week starts week on Sunday and returns 0-based week number
    const week = Math.floor((dayOfYear + startOfYearDay - 1) / 7);
    return week;
}

// Admin middleware (legacy check for both username and role)
// We keep this local version to support the "TravelNest" master account
function requireAdmin(req, res, next) {
    if (req.user?.username === "TravelNest" || req.user?.role === 'admin') return next();
    return res.status(403).json({ message: 'Admin access required' });
}

/**
 * GET /api/admin/users
 * Get all users with their booking statistics
 * Includes total bookings, total spent, and last booking date
 */
router.get('/users', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        // Fetch all users except the master TravelNest account
        const users = await User.find({ username: { $ne: "TravelNest" } })
            .sort('-createdAt');
        
        // Aggregate booking statistics for all users in one efficient query
        const bookingStats = await Booking.aggregate([
            {
                $group: {
                    _id: '$user',
                    totalBookings: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    lastBooking: { $max: '$createdAt' }
                }
            }
        ]);

        // Create a map for O(1) lookup performance
        const statsMap = {};
        bookingStats.forEach(stat => {
            if (stat._id) statsMap[String(stat._id)] = stat;
        });
        
        // Map booking stats to users
        const usersWithStats = users.map((user) => {
            const stat = statsMap[String(user._id)] || {};
            
            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                isMember: user.isMember || false,
                membershipExpiresAt: user.membershipExpiresAt,
                totalBookings: stat.totalBookings || 0,
                totalSpent: stat.totalSpent || 0,
                lastBooking: stat.lastBooking ? new Date(stat.lastBooking) : null
            };
        });
        
        res.status(200).json({ success: true, users: usersWithStats });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * GET /api/admin/hotels
 * Get all approved hotels with their booking and revenue statistics
 * Calculates platform revenue based on commission and owner revenue share
 */
router.get('/hotels', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        // Only fetch approved hotels (or legacy ones with no status)
        const hotels = await Listing.find({
            $or: [
                { status: 'approved' },
                { status: { $exists: false } }
            ]
        })
            .populate('owner', 'username email')
            .sort('-createdAt');
        
        const OWNER_REVENUE_RATE = 0.15; // 15% commission on owner gross revenue

        // Aggregate booking stats for all hotels in one query
        const bookingStats = await Booking.aggregate([
            {
                $group: {
                    _id: '$listing',
                    bookingCount: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' },
                    commission: { $sum: '$platformCommission' }
                }
            }
        ]);

        // Create a map for O(1) lookup
        const statsMap = {};
        bookingStats.forEach(stat => {
            if (stat._id) statsMap[String(stat._id)] = stat;
        });
        
        const hotelsWithStats = hotels.map((hotel) => {
            const stat = statsMap[String(hotel._id)] || {};
            
            const grossRevenue = stat.revenue || 0;
            const commission = stat.commission || 0;
            const ownerGrossRevenue = Math.max(0, grossRevenue - commission);
            const ownerCommission = ownerGrossRevenue * OWNER_REVENUE_RATE;
            const platformRevenue = commission + ownerCommission;
            
            const createdAt = hotel.createdAt || (hotel._id && hotel._id.getTimestamp ? hotel._id.getTimestamp() : null);
            
            return {
                _id: hotel._id,
                title: hotel.title,
                location: hotel.location,
                country: hotel.country,
                price: hotel.price,
                owner: hotel.owner,
                createdAt,
                lastUpdated: hotel.lastUpdated,
                bookingCount: stat.bookingCount || 0,
                revenue: grossRevenue,
                commission,
                platformRevenue,
                images: hotel.images
            };
        });
        
        res.status(200).json({ success: true, hotels: hotelsWithStats });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({ error: 'Failed to fetch hotels' });
    }
});

/**
 * GET /api/admin/owners
 * Get per-owner (hotel manager) statistics
 * Shows revenue breakdown, hotel counts, and platform earnings per manager
 */
router.get('/owners', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const OWNER_REVENUE_RATE = 0.15;

        // 1) Aggregate bookings by owner via lookup to listings
        const ownerStats = await Booking.aggregate([
            {
                $lookup: {
                    from: 'listings',
                    localField: 'listing',
                    foreignField: '_id',
                    as: 'listing'
                }
            },
            { $unwind: '$listing' },
            {
                $group: {
                    _id: '$listing.owner',
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalCommission: { $sum: '$platformCommission' }
                }
            }
        ]);

        // 2) Count hotels per owner
        const hotelCountsAgg = await Listing.aggregate([
            {
                $group: {
                    _id: '$owner',
                    hotelCount: { $sum: 1 }
                }
            }
        ]);

        const hotelCountByOwner = {};
        hotelCountsAgg.forEach((row) => {
            if (!row._id) return;
            hotelCountByOwner[String(row._id)] = row.hotelCount;
        });

        const statsByOwner = {};
        ownerStats.forEach((row) => {
            if (!row._id) return;
            statsByOwner[String(row._id)] = row;
        });

        // 3) Collect all owner IDs who either have hotels or bookings
        const allOwnerIdStrings = new Set([
            ...ownerStats.map((r) => String(r._id)),
            ...hotelCountsAgg.map((r) => String(r._id)),
        ].filter((id) => id && id !== 'null' && id !== 'undefined'));

        // 4) Load owner user documents - include all managers and any users found in stats
        const owners = await User.find({
            $or: [
                { role: 'manager' },
                { _id: { $in: Array.from(allOwnerIdStrings) } }
            ]
        }).select('username email createdAt role');

        const ownersById = {};
        owners.forEach((u) => {
            ownersById[String(u._id)] = u;
        });

        // Combine all IDs: those from stats AND those from the User query
        const finalOwnerIds = new Set([
            ...allOwnerIdStrings,
            ...owners.map(u => String(u._id))
        ]);

        // 5) Build final array with comprehensive stats
        const ownersWithStats = Array.from(finalOwnerIds).map((idStr) => {
            const stat = statsByOwner[idStr] || {};
            const user = ownersById[idStr] || {};
            const hotelCount = hotelCountByOwner[idStr] || 0;

            const grossRevenue = stat.totalRevenue || 0;
            const commission = stat.totalCommission || 0;
            const totalBookings = stat.totalBookings || 0;
            const ownerGrossRevenue = Math.max(0, grossRevenue - commission);
            const ownerCommission = ownerGrossRevenue * OWNER_REVENUE_RATE;
            const platformRevenue = commission + ownerCommission;

            return {
                ownerId: user._id || idStr,
                username: user.username || 'Unknown',
                email: user.email || '',
                role: user.role || 'manager',
                hotels: hotelCount,
                totalBookings,
                grossRevenue,
                commission,
                ownerCommission,
                platformRevenue,
                createdAt: user.createdAt,
            };
        })
        .filter(owner => owner.username !== 'Unknown') // Filter out orphaned data
        .sort((a, b) => (b.platformRevenue || 0) - (a.platformRevenue || 0));

        res.status(200).json({ success: true, owners: ownersWithStats });
    } catch (error) {
        console.error('Error fetching owners:', error);
        res.status(500).json({ error: 'Failed to fetch owners' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user and all associated data (bookings, hotels, reviews)
 * Cascading delete to maintain data integrity
 */
router.delete('/users/:id', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Delete bookings made BY this user (as a traveller)
        await Booking.deleteMany({ user: id });

        // 2. If user is a manager, find their hotels to clean up related data
        const userListings = await Listing.find({ owner: id });
        
        if (userListings.length > 0) {
            const listingIds = userListings.map(l => l._id);
            
            // Delete bookings FOR these hotels
            await Booking.deleteMany({ listing: { $in: listingIds } });
            
            // Delete reviews FOR these hotels
            const reviewIds = userListings.reduce((acc, listing) => {
                if (listing.reviews && listing.reviews.length > 0) {
                    return acc.concat(listing.reviews);
                }
                return acc;
            }, []);
            
            if (reviewIds.length > 0) {
                await Review.deleteMany({ _id: { $in: reviewIds } });
            }

            // Delete the hotels themselves
            await Listing.deleteMany({ owner: id });
        }

        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            // If user is not found, but we might have cleaned up associated data (bookings/listings)
            // We should consider this a success for the admin's intent of "removing this entity"
            return res.status(200).json({ 
                success: true, 
                message: 'User was already deleted, but associated data has been cleaned up.' 
            });
        }
        
        res.status(200).json({ success: true, message: 'User and their associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

/**
 * DELETE /api/admin/hotels/:id
 * Delete a hotel and all associated bookings
 */
router.delete('/hotels/:id', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedHotel = await Listing.findByIdAndDelete(id);
        
        if (!deletedHotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }

        // Delete bookings associated with this hotel
        await Booking.deleteMany({ listing: id });
        
        res.status(200).json({ success: true, message: 'Hotel deleted successfully' });
    } catch (error) {
        console.error('Error deleting hotel:', error);
        res.status(500).json({ error: 'Failed to delete hotel' });
    }
});

/**
 * PATCH /api/admin/users/:id/membership
 * Update user membership status (activate/deactivate)
 * When activating, sets 30-day membership period
 */
router.patch('/users/:id/membership', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isMember } = req.body;
        
        const updateData = { isMember };
        if (isMember) {
            // Activate membership for 30 days
            const now = new Date();
            updateData.membershipExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
            updateData.membershipExpiresAt = null;
        }
        
        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ success: true, message: 'User membership updated successfully' });
    } catch (error) {
        console.error('Error updating user membership:', error);
        res.status(500).json({ error: 'Failed to update user membership' });
    }
});

// ===== Manager approval APIs =====

/**
 * GET /api/admin/managers/pending
 * Get all pending manager approval requests
 */
router.get('/managers/pending', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const managers = await User.find({ role: 'manager', isApproved: false })
            .sort('-createdAt');
        res.status(200).json({ success: true, managers });
    } catch (error) {
        console.error('Error fetching pending managers:', error);
        res.status(500).json({ error: 'Failed to fetch pending managers' });
    }
});

/**
 * PATCH /api/admin/managers/:id/approve
 * Approve a manager request, allowing them to manage hotels
 */
router.patch('/managers/:id/approve', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            isApproved: true,
            approvedAt: new Date(),
            approvedBy: req.user._id
        };
        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        res.status(200).json({ success: true, message: 'Manager approved successfully' });
    } catch (error) {
        console.error('Error approving manager:', error);
        res.status(500).json({ error: 'Failed to approve manager' });
    }
});

/**
 * PATCH /api/admin/managers/:id/reject
 * Reject a manager request, demoting them back to traveller role
 */
router.patch('/managers/:id/reject', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            role: 'traveller',
            isApproved: false,
            approvedAt: null,
            approvedBy: null
        };
        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        res.status(200).json({ success: true, message: 'Manager request rejected' });
    } catch (error) {
        console.error('Error rejecting manager:', error);
        res.status(500).json({ error: 'Failed to reject manager' });
    }
});

// ===== Hotel approval APIs =====

/**
 * GET /api/admin/hotels/pending
 * Get all pending hotel approval requests
 */
router.get('/hotels/pending', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const hotels = await Listing.find({ status: 'pending' })
            .populate('owner', 'username email')
            .sort('-createdAt');
        res.status(200).json({ success: true, hotels });
    } catch (error) {
        console.error('Error fetching pending hotels:', error);
        res.status(500).json({ error: 'Failed to fetch pending hotels' });
    }
});

/**
 * PATCH /api/admin/hotels/:id/approve
 * Approve a hotel listing, making it available for booking
 */
router.patch('/hotels/:id/approve', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: req.user._id
        };
        const updatedHotel = await Listing.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedHotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        res.status(200).json({ success: true, message: 'Hotel approved successfully' });
    } catch (error) {
        console.error('Error approving hotel:', error);
        res.status(500).json({ error: 'Failed to approve hotel' });
    }
});

/**
 * PATCH /api/admin/hotels/:id/reject
 * Reject a hotel listing with optional reason
 */
router.patch('/hotels/:id/reject', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const updateData = {
            status: 'rejected',
            rejectionReason: reason || 'Does not meet platform guidelines',
            approvedAt: null,
            approvedBy: null
        };

        const updatedHotel = await Listing.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!updatedHotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        
        res.status(200).json({ success: true, message: 'Hotel rejected successfully' });
    } catch (error) {
        console.error('Error rejecting hotel:', error);
        res.status(500).json({ error: 'Failed to reject hotel' });
    }
});

/**
 * Helper function to generate consecutive periods for chart data
 * Creates consistent time periods (days/weeks/months/years) for analytics
 */
function generateConsecutivePeriods(period, count = 12) {
    const periods = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now);
        let label, key;
        
        switch (period) {
            case 'day':
                date.setDate(now.getDate() - i);
                label = `${date.getDate()}/${date.getMonth() + 1}`;
                key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                break;
            case 'week':
                date.setDate(now.getDate() - (i * 7));
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                // Use MongoDB-compatible week calculation
                const weekNumber = getMongoWeek(weekStart);
                label = `W${weekNumber}`;
                key = `${weekStart.getFullYear()}-W${weekNumber}`;
                break;
            case 'month':
                date.setMonth(now.getMonth() - i);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                label = monthNames[date.getMonth()];
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                break;
            case 'year':
                date.setFullYear(now.getFullYear() - i);
                label = `${date.getFullYear()}`;
                key = `${date.getFullYear()}`;
                break;
            default:
                date.setMonth(now.getMonth() - i);
                label = `${date.getMonth() + 1}/${date.getFullYear()}`;
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }
        
        periods.push({ label, key, revenue: 0, bookings: 0, commission: 0 });
    }
    
    return periods;
}

/**
 * GET /api/admin/charts/revenue
 * Get revenue chart data for dashboard analytics
 * Supports different time periods (day/week/month/year)
 */
router.get('/charts/revenue', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let groupBy, matchConditions = {};
        
        // Set date range for the query
        const now = new Date();
        const startDate = new Date(now);
        
        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 11);
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case 'week':
                startDate.setDate(now.getDate() - (11 * 7));
                groupBy = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 11);
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 11);
                groupBy = {
                    year: { $year: '$createdAt' }
                };
                break;
        }
        
        matchConditions.createdAt = { $gte: startDate, $lte: now };
        
        const revenueData = await Booking.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: groupBy,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalBookings: { $sum: 1 },
                    totalCommission: { $sum: '$platformCommission' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ]);
        
        // Generate consecutive periods
        const consecutivePeriods = generateConsecutivePeriods(period, 12);
        
        // Map actual data to consecutive periods
        revenueData.forEach(item => {
            let key;
            switch (period) {
                case 'day':
                    key = `${item._id.year}-${item._id.month}-${item._id.day}`;
                    break;
                case 'week':
                    key = `${item._id.year}-W${item._id.week}`;
                    break;
                case 'month':
                    key = `${item._id.year}-${item._id.month}`;
                    break;
                case 'year':
                    key = `${item._id.year}`;
                    break;
            }
            
            const periodIndex = consecutivePeriods.findIndex(p => p.key === key);
            if (periodIndex !== -1) {
                consecutivePeriods[periodIndex].revenue = item.totalRevenue;
                consecutivePeriods[periodIndex].bookings = item.totalBookings;
                consecutivePeriods[periodIndex].commission = item.totalCommission || 0;
            }
        });
        
        res.status(200).json({ success: true, data: consecutivePeriods });
    } catch (error) {
        console.error('Error fetching revenue chart data:', error);
        res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
});

/**
 * GET /api/admin/charts/top-hotels
 * Get top 5 performing hotels by booking count for dashboard
 */
router.get('/charts/top-hotels', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const topHotels = await Booking.aggregate([
            {
                $group: {
                    _id: '$listing',
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'listings',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'hotel'
                }
            },
            { $unwind: '$hotel' }
        ]);
        
        let formattedData = topHotels.map(item => ({
            name: item.hotel.title,
            bookings: item.totalBookings,
            revenue: item.totalRevenue
        }));
        
        // If no bookings found, get top 5 hotels by creation date as fallback
        if (formattedData.length === 0) {
            const hotels = await Listing.find({})
                .sort('-createdAt')
                .limit(5)
                .select('title');
            
            formattedData = hotels.map(hotel => ({
                name: hotel.title,
                bookings: 0,
                revenue: 0
            }));
        }
        
        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error('Error fetching top hotels data:', error);
        res.status(500).json({ error: 'Failed to fetch top hotels data' });
    }
});

/**
 * GET /api/admin/charts/bookings-trend
 * Get booking trends chart data for dashboard analytics
 * Supports different time periods (day/week/month/year)
 */
router.get('/charts/bookings-trend', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let groupBy, matchConditions = {};
        
        // Set date range for the query
        const now = new Date();
        const startDate = new Date(now);
        
        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 11);
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case 'week':
                startDate.setDate(now.getDate() - (11 * 7));
                groupBy = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 11);
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 11);
                groupBy = {
                    year: { $year: '$createdAt' }
                };
                break;
        }
        
        matchConditions.createdAt = { $gte: startDate, $lte: now };
        
        const bookingsTrend = await Booking.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: groupBy,
                    totalBookings: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ]);
        
        // Generate consecutive periods
        const consecutivePeriods = generateConsecutivePeriods(period, 12);
        
        // Map actual data to consecutive periods
        bookingsTrend.forEach(item => {
            let key;
            switch (period) {
                case 'day':
                    key = `${item._id.year}-${item._id.month}-${item._id.day}`;
                    break;
                case 'week':
                    key = `${item._id.year}-W${item._id.week}`;
                    break;
                case 'month':
                    key = `${item._id.year}-${item._id.month}`;
                    break;
                case 'year':
                    key = `${item._id.year}`;
                    break;
            }
            
            const periodIndex = consecutivePeriods.findIndex(p => p.key === key);
            if (periodIndex !== -1) {
                consecutivePeriods[periodIndex].bookings = item.totalBookings;
            }
        });
        
        res.status(200).json({ success: true, data: consecutivePeriods });
    } catch (error) {
        console.error('Error fetching bookings trend data:', error);
        res.status(500).json({ error: 'Failed to fetch bookings trend data' });
    }
});

/**
 * GET /api/admin/commission/summary
 * Get commission summary for admin overview
 * Shows total commission, revenue, bookings, and average commission per booking
 */
router.get('/commission/summary', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const summary = await Booking.aggregate([
            {
                $group: {
                    _id: null,
                    totalCommission: { $sum: '$platformCommission' },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalBookings: { $sum: 1 }
                }
            }
        ]);
        const data = summary[0] || { totalCommission: 0, totalRevenue: 0, totalBookings: 0 };
        const avgCommissionPerBooking = data.totalBookings > 0
            ? data.totalCommission / data.totalBookings
            : 0;
        res.status(200).json({
            success: true,
            summary: {
                totalCommission: data.totalCommission,
                totalRevenue: data.totalRevenue,
                totalBookings: data.totalBookings,
                avgCommissionPerBooking
            }
        });
    } catch (error) {
        console.error('Error fetching commission summary:', error);
        res.status(500).json({ error: 'Failed to fetch commission summary' });
    }
});

/**
 * GET /api/admin/contact-messages
 * Get all contact messages from users/visitors
 */
router.get('/contact-messages', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const messages = await ContactMessage.find()
            .sort('-createdAt');
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
});

module.exports = router;
