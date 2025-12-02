const Listing = require('../models/listing');
const Review = require('../models/review');
const Booking = require('../models/booking');

module.exports.postReview = async (req, res) => {
    try {
        let listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }



        // Handle photo uploads
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            const { uploadMultipleToCloudinary } = require('../utils/cloudinary');
            photoUrls = await uploadMultipleToCloudinary(req.files, 'reviews');
        }

        // Create the review
        let review = new Review({
            ...req.body,
            photos: photoUrls
        });
        review.author = req.user._id;

        listing.reviews.push(review);

        await review.save();
        await listing.save();

        // Populate the author details so React can display "By [Username]" immediately
        await review.populate('author', 'username');

        res.status(201).json({
            message: 'Review posted successfully!',
            review: review
        });
    } catch (e) {
        res.status(500).json({ message: "Error posting review", error: e.message });
    }
};

module.exports.deleteReview = async (req, res) => {
    try {
        let { id, reviewId } = req.params;
        
        // Remove reference from Listing
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        
        // Delete the actual review document
        await Review.findByIdAndDelete(reviewId);
        
        res.status(200).json({ message: 'Review deleted successfully!' });
    } catch (e) {
        res.status(500).json({ message: "Error deleting review", error: e.message });
    }
};