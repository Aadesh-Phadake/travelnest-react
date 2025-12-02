const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Listing = require('../models/listing');
const Booking = require('../models/booking');
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

// Get all users with statistics
router.get('/users', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({ username: { $ne: "TravelNest" } })
            .sort('-createdAt');
        
        // Add booking statistics for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const bookings = await Booking.find({ user: user._id });
            const totalBookings = bookings.length;
            const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
            const lastBooking = bookings.length > 0 ? 
                Math.max(...bookings.map(b => new Date(b.createdAt).getTime())) : null;
            
            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                isMember: user.isMember || false,
                membershipExpiresAt: user.membershipExpiresAt,
                totalBookings,
                totalSpent,
                lastBooking: lastBooking ? new Date(lastBooking) : null
            };
        }));
        
        res.status(200).json({ success: true, users: usersWithStats });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all hotels with statistics
router.get('/hotels', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        // Only fetch approved hotels (or legacy ones with no status)
        // Pending hotels are shown in the "Approvals" tab
        const hotels = await Listing.find({
            $or: [
                { status: 'approved' },
                { status: { $exists: false } }
            ]
        })
            .populate('owner', 'username email')
            .sort('-createdAt');
        
        // Add booking count and revenue/commission stats for each hotel
        const OWNER_REVENUE_RATE = 0.15;
        const hotelsWithStats = await Promise.all(hotels.map(async (hotel) => {
            const bookingCount = await Booking.countDocuments({ listing: hotel._id });
            const totals = await Booking.aggregate([
                { $match: { listing: hotel._id } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' },
                        totalCommission: { $sum: '$platformCommission' }
                    }
                }
            ]);

            const grossRevenue = totals[0] ? totals[0].total : 0;
            const commission = totals[0] ? (totals[0].totalCommission || 0) : 0;
            const ownerGrossRevenue = Math.max(0, grossRevenue - commission);
            const ownerCommission = ownerGrossRevenue * OWNER_REVENUE_RATE;
            const platformRevenue = commission + ownerCommission;
            
            // Prefer createdAt; fall back to ObjectId timestamp for older documents
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
                bookingCount,
                revenue: grossRevenue,
                commission,
                platformRevenue,
                images: hotel.images
            };
        }));
        
        res.status(200).json({ success: true, hotels: hotelsWithStats });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({ error: 'Failed to fetch hotels' });
    }
});

// Get per-owner (hotel manager) statistics
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

        // 5) Build final array
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
        }).sort((a, b) => (b.platformRevenue || 0) - (a.platformRevenue || 0));

        res.status(200).json({ success: true, owners: ownersWithStats });
    } catch (error) {
        console.error('Error fetching owners:', error);
        res.status(500).json({ error: 'Failed to fetch owners' });
    }
});

// Delete user
router.delete('/users/:id', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Also delete user's bookings
        await Booking.deleteMany({ user: id });

        // Delete listings owned by the user (if they are a manager)
        await Listing.deleteMany({ owner: id });

        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ success: true, message: 'User and their bookings deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Delete hotel
router.delete('/hotels/:id', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedHotel = await Listing.findByIdAndDelete(id);
        
        if (!deletedHotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        
        res.status(200).json({ success: true, message: 'Hotel deleted successfully' });
    } catch (error) {
        console.error('Error deleting hotel:', error);
        res.status(500).json({ error: 'Failed to delete hotel' });
    }
});

// Update user membership status
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

// Get pending manager approvals
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

// Approve manager
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

// Reject manager (optional: demote to traveller)
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

// Get pending hotel approvals
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

// Approve hotel
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

// Reject hotel
router.patch('/hotels/:id/reject', isLoggedIn, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete the hotel listing and its associated bookings
        const deletedHotel = await Listing.findByIdAndDelete(id);
        
        if (!deletedHotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }

        // Clean up any bookings associated with this listing (though unlikely for pending hotels)
        await Booking.deleteMany({ listing: id });
        
        res.status(200).json({ success: true, message: 'Hotel rejected and removed successfully' });
    } catch (error) {
        console.error('Error rejecting hotel:', error);
        res.status(500).json({ error: 'Failed to reject hotel' });
    }
});

// Helper function to generate consecutive periods
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

// Get chart data for dashboard
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

// Get top hotels data
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

// Get bookings trend data
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

// Commission summary for admin overview
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

// Get all contact messages
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
