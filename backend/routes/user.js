const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const wrapAsync = require('../utils/wrapAsync');
// REMOVED saveRedirectUrl from here
const { isLoggedIn, requireTraveller } = require('../middleware');
const userController = require('../controllers/user');

// Signup - POST only (React handles the form UI)
router.route('/signup')
    .post(wrapAsync(userController.signup));

// Login - POST only
// Removed saveRedirectUrl
// Removed failureRedirect (Passport will send 401 Unauthorized automatically on failure)
router.route('/login')
    .post(passport.authenticate('local'), userController.login);
 
router.get('/logout', userController.logout);

// Profile Data
// Note: You must update userController.renderProfile to return JSON data instead of res.render
router.get('/profile', isLoggedIn, requireTraveller, wrapAsync(userController.renderProfile));

router.post('/membership/activate', isLoggedIn, wrapAsync(userController.activateMembership));

// Changed to DELETE for API standards
router.delete('/profile/cancel/:id', isLoggedIn, wrapAsync(userController.deleteBooking));

// Removed renderCancelConfirm (React handles the confirmation UI)
router.post('/profile/cancel/confirm/:id', isLoggedIn, wrapAsync(userController.confirmCancellation));

router.post('/listings/:id/book', isLoggedIn, wrapAsync(userController.createBooking));

// Simple dashboard
router.get('/dashboard', isLoggedIn, wrapAsync(userController.ownerDashboard));

// AJAX API Routes (These are already good for React, just ensure controllers return JSON)
router.get('/api/profile/cancel/:id/details', isLoggedIn, wrapAsync(userController.getCancellationDetails));
router.post('/api/profile/cancel/:id/confirm', isLoggedIn, wrapAsync(userController.confirmCancellationAjax));
router.post('/api/membership/activate', isLoggedIn, wrapAsync(userController.activateMembershipAjax));

router.get('/dashboard/search', isLoggedIn, wrapAsync(userController.searchDashboard));
router.get('/dashboard/hotels', isLoggedIn, wrapAsync(userController.getUserHotels));

// Admin dashboard
router.get('/admin/dashboard', isLoggedIn, wrapAsync(userController.adminDashboard));

module.exports = router;