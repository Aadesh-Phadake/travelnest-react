const Listing = require('./models/listing');
const expressError = require('./utils/expressError');
const { listingSchema, reviewSchema } = require('./schema');
const Review = require('./models/review');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // React needs a 401 status to know it should show the login modal/page
        return res.status(401).json({ 
            message: 'Login required to perform this action.',
            redirect: '/login' 
        });
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
    }

    // specific check: Use req.user._id instead of res.locals
    if (!listing.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'You do not have permission to edit this listing!' });
    }
    next();
};

module.exports.isOwnerOrAdmin = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
    }
    
    // Check if user is the owner of the listing or has admin role
    if (!listing.owner.equals(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You do not have permission to do that!' });
    }

    next();
};

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new expressError(400, msg); // This will be caught by the app.js error handler and sent as JSON
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new expressError(400, msg);
    } else {
        next();
    }
};

module.exports.isAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    
    if (!review) {
        return res.status(404).json({ message: "Review not found" });
    }

    if (!review.author.equals(req.user._id)) {
        return res.status(403).json({ message: 'You do not have permission to delete this review!' });
    }
    next();
};

// Role-based middleware
module.exports.requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'You must be logged in' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        
        next();
    };
};

module.exports.requireTraveller = module.exports.requireRole(['traveller']);
module.exports.requireManager = module.exports.requireRole(['manager']);
module.exports.requireAdmin = module.exports.requireRole(['admin']);
module.exports.requireManagerOrAdmin = module.exports.requireRole(['manager', 'admin']);
module.exports.requireTravellerOrManager = module.exports.requireRole(['traveller', 'manager']);