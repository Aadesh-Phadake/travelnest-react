const User = require('../models/user');
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const Request = require('../models/request');

// ===============================
// AUTHENTICATION CONTROLLERS
// ===============================

// REMOVED: renderSignup and renderLogin (React handles the UI)

// ✅ Handle signup
module.exports.signup = async (req, res) => {
    try {
        let { username, email, password, role } = req.body;

        if (!['traveller', 'manager'].includes(role)) {
            return res.status(400).json({ message: 'Invalid account type.' });
        }

        const isManager = role === 'manager';
        // Managers must be approved by an admin before accessing manager features
        let user = new User({
            username,
            email,
            role,
            isApproved: !isManager
        });
        let registeredUser = await User.register(user, password);

        req.login(registeredUser, err => {
            if (err) {
                return res.status(500).json({ message: 'Login after signup failed' });
            }
            return res.status(201).json({
                message: 'Welcome to TravelNest!',
                user: registeredUser
            });
        });
    } catch (e) {
        return res.status(400).json({ message: e.message });
    }
};

// ✅ Handle login
module.exports.login = async (req, res) => {
    // Passport middleware has already authenticated the user
    res.status(200).json({
        message: 'Welcome back!',
        user: req.user
    });
};

// ✅ Handle logout
module.exports.logout = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.status(200).json({ message: 'Logged out successfully!' });
    });
};

// ===============================
// USER PROFILE + MEMBERSHIP
// ===============================

module.exports.renderProfile = async (req, res) => {
    // Even though the name is "renderProfile", we now return JSON data
    try {
        console.time('⏱️ GET /profile');
        const bookings = await Booking.find({ user: req.user._id })
            .populate('listing')
            .sort('-createdAt')
            .lean(); // Performance: return plain JS objects

        console.timeEnd('⏱️ GET /profile');
        res.status(200).json({
            user: req.user,
            bookings
        });
    } catch (e) {
        console.timeEnd('⏱️ GET /profile');
        res.status(500).json({ message: "Error fetching profile" });
    }
};

// ✅ Update user profile
module.exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = {};

        // Handle different fields based on user role
        if (req.user.role === 'traveller') {
            if (req.body.name) updates.name = req.body.name;
            if (req.body.email) updates.email = req.body.email;
            if (req.body.phone) updates.phone = req.body.phone;
            if (req.body.address) updates.address = req.body.address;
            if (req.body.travelPreferences) updates.travelPreferences = req.body.travelPreferences;
        } else if (req.user.role === 'manager') {
            if (req.body.name) updates.name = req.body.name;
            if (req.body.email) updates.email = req.body.email;
            if (req.body.hotelName) updates.hotelName = req.body.hotelName;
            if (req.body.hotelAddress) updates.hotelAddress = req.body.hotelAddress;
            if (req.body.phone) updates.phone = req.body.phone;
        } else if (req.user.role === 'admin' || req.user.role === 'staff') {
            if (req.body.name) updates.name = req.body.name;
            if (req.body.email) updates.email = req.body.email;
            if (req.body.systemAccess) updates.systemAccess = req.body.systemAccess;
        }

        // Handle file uploads
        if (req.files && req.files.profilePhoto && req.files.profilePhoto[0]) {
            updates.profilePhoto = req.files.profilePhoto[0].path;
        }

        // Handle documents for managers
        if (req.user.role === 'manager') {
            let documents = [];
            if (req.body.existingDocuments) {
                documents = JSON.parse(req.body.existingDocuments);
            }
            if (req.files && req.files.documents) {
                documents = documents.concat(req.files.documents.map(file => file.path));
            }
            updates.documents = documents;
        }

        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// ✅ Change user password
module.exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await user.authenticate(currentPassword);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        await user.setPassword(newPassword);
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

module.exports.activateMembership = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        user.isMember = true;
        user.membershipExpiresAt = expires;

        if (!user.freeCancellationsResetAt) {
            user.freeCancellationsResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            user.freeCancellationsUsed = 0;
        }

        await user.save();
        res.status(200).json({
            message: 'Membership activated for 30 days!',
            user
        });
    } catch (e) {
        res.status(500).json({ message: 'Could not activate membership' });
    }
};

// ===============================
// BOOKINGS
// ===============================

module.exports.createBooking = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const { checkIn, checkOut, guests } = req.body;

        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: 'checkIn and checkOut are required.' });
        }

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        };

        const checkInDate = parseDate(checkIn);
        const checkOutDate = parseDate(checkOut);

        if (!checkInDate || !checkOutDate) {
            return res.status(400).json({ message: 'Invalid checkIn/checkOut date format.' });
        }

        let nights = 0;
        let serviceFee = 0; // platform commission
        let totalAmount = 0;

        const numGuests = parseInt(guests, 10) || 1;
        if (numGuests < 1 || numGuests > 5) {
            return res.status(400).json({ message: 'guests must be between 1 and 5.' });
        }

        nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        if (nights <= 0) {
            return res.status(400).json({ message: 'checkOut must be after checkIn.' });
        }

        let baseAmount = listing.price * nights;
        if (numGuests > 2) {
            const additionalGuestFee = (numGuests - 2) * 500 * nights;
            baseAmount += additionalGuestFee;
        }

        const isActiveMember = req.user && req.user.isMember && req.user.membershipExpiresAt && new Date(req.user.membershipExpiresAt) > new Date();
        serviceFee = isActiveMember ? 0 : Math.round(baseAmount * 0.05);
        totalAmount = baseAmount + serviceFee;

        const booking = new Booking({
            user: req.user._id,
            listing: listing._id,
            listingTitle: listing.title || '',
            listingLocation: listing.location || '',
            listingCountry: listing.country || '',
            checkIn,
            checkOut,
            guests: parseInt(guests) || 1,
            totalAmount: totalAmount || 0,
            platformCommission: serviceFee || 0
        });

        await booking.save();
        res.status(201).json({ message: 'Booking confirmed successfully!', booking });

    } catch (e) {
        res.status(500).json({ message: "Error creating booking", error: e.message });
    }
};

// ===============================
// IMPORTANT: YOU MUST UPDATE THE REST
// ===============================

// You mentioned: "Include all other methods..."
// You MUST go through those methods (ownerDashboard, deleteBooking, etc.) 
// and do the exact same thing:
// 1. Remove res.render
// 2. Remove res.redirect
// 3. Remove req.flash
// 4. Use res.json(...)

// Example for deleteBooking:
module.exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking || !booking.user.equals(req.user._id)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Restore rooms if room allocation exists
        if (booking.roomAllocation && booking.listing) {
            try {
                const listing = await Listing.findById(booking.listing);
                if (listing && listing.roomTypes) {
                    listing.roomTypes.single = (listing.roomTypes.single || 0) + (booking.roomAllocation.single || 0);
                    listing.roomTypes.double = (listing.roomTypes.double || 0) + (booking.roomAllocation.double || 0);
                    listing.roomTypes.triple = (listing.roomTypes.triple || 0) + (booking.roomAllocation.triple || 0);

                    // Update total rooms
                    listing.rooms = (listing.roomTypes.single || 0) + (listing.roomTypes.double || 0) + (listing.roomTypes.triple || 0);

                    await listing.save();
                    console.log(`✅ Rooms restored for booking ${booking._id}`);
                }
            } catch (roomErr) {
                // If listing doesn't exist, that's okay — just proceed with deletion
                console.warn(`⚠️  Could not restore rooms for booking ${booking._id}: ${roomErr.message}`);
            }
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Booking cancelled successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// ===============================
// CURRENT USER
// ===============================

// ✅ Get current authenticated user
module.exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching user data' });
    }
};

// ===============================
// CANCELLATION
// ===============================

module.exports.confirmCancellation = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking || !booking.user.equals(req.user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        booking.status = 'cancelled';
        booking.cancelledBy = 'user';
        booking.cancelledAt = new Date();
        await booking.save();
        res.status(200).json({ message: 'Booking cancelled successfully', booking });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

module.exports.confirmCancellationAjax = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking || !booking.user.equals(req.user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        booking.status = 'cancelled';
        booking.cancelledBy = 'user';
        booking.cancelledAt = new Date();
        await booking.save();
        res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports.getCancellationDetails = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('listing', 'title location price')
            .lean();
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json({ booking });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// ===============================
// MEMBERSHIP (AJAX)
// ===============================

module.exports.activateMembershipAjax = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        user.isMember = true;
        user.membershipExpiresAt = expires;
        await user.save();
        res.status(200).json({ success: true, message: 'Membership activated!', user });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Could not activate membership' });
    }
};

// ===============================
// DASHBOARD
// ===============================

module.exports.ownerDashboard = async (req, res) => {
    try {
        console.time('⏱️ GET /dashboard');
        const listings = await Listing.find({ owner: req.user._id }).lean();
        const bookings = await Booking.find({ user: req.user._id })
            .populate('listing', 'title location')
            .sort('-createdAt')
            .lean();

        console.timeEnd('⏱️ GET /dashboard');
        res.status(200).json({
            user: req.user,
            listings,
            bookings
        });
    } catch (e) {
        console.timeEnd('⏱️ GET /dashboard');
        res.status(500).json({ message: 'Error loading dashboard' });
    }
};

module.exports.searchDashboard = async (req, res) => {
    try {
        const { q } = req.query;
        let filter = { owner: req.user._id };

        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } }
            ];
        }

        const listings = await Listing.find(filter).lean();
        res.status(200).json({ listings });
    } catch (e) {
        res.status(500).json({ message: 'Error searching dashboard' });
    }
};

module.exports.getUserHotels = async (req, res) => {
    try {
        const listings = await Listing.find({ owner: req.user._id })
            .sort('-createdAt')
            .lean();
        res.status(200).json({ hotels: listings });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching hotels' });
    }
};

module.exports.adminDashboard = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const totalUsers = await User.countDocuments({ role: 'traveller' });
        const totalManagers = await User.countDocuments({ role: 'manager' });
        const totalListings = await Listing.countDocuments();
        const totalBookings = await Booking.countDocuments();

        res.status(200).json({
            totalUsers,
            totalManagers,
            totalListings,
            totalBookings
        });
    } catch (e) {
        res.status(500).json({ message: 'Error loading admin dashboard' });
    }
};
