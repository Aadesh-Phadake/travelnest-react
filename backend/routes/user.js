const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, requireTraveller } = require('../middleware');
const userController = require('../controllers/user');
const multer = require('multer');
const { storage } = require('../utils/multer');
const upload = multer({ storage });

/**
 * @swagger
 * /signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.route('/signup')
    .post(wrapAsync(userController.signup));

/**
 * @swagger
 * /login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.route('/login')
    .post(passport.authenticate('local'), userController.login);

/**
 * @swagger
 * /logout:
 *   get:
 *     tags: [Authentication]
 *     summary: Logout the current user
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', userController.logout);

/**
 * @swagger
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get current user's profile data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', isLoggedIn, wrapAsync(userController.renderProfile));

/**
 * @swagger
 * /profile/update:
 *   put:
 *     tags: [Profile]
 *     summary: Update user profile (with optional photo and documents)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile/update', isLoggedIn, upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'documents', maxCount: 10 }]), wrapAsync(userController.updateProfile));

/**
 * @swagger
 * /profile/change-password:
 *   put:
 *     tags: [Profile]
 *     summary: Change user password
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put('/profile/change-password', isLoggedIn, wrapAsync(userController.changePassword));

/**
 * @swagger
 * /me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Not authenticated
 */
router.get('/me', isLoggedIn, wrapAsync(userController.getCurrentUser));

/**
 * @swagger
 * /membership/activate:
 *   post:
 *     tags: [Membership]
 *     summary: Activate membership
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Membership activated
 */
router.post('/membership/activate', isLoggedIn, wrapAsync(userController.activateMembership));

/**
 * @swagger
 * /profile/cancel/{id}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.delete('/profile/cancel/:id', isLoggedIn, wrapAsync(userController.deleteBooking));

/**
 * @swagger
 * /profile/cancel/confirm/{id}:
 *   post:
 *     tags: [Bookings]
 *     summary: Confirm booking cancellation
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Cancellation confirmed
 */
router.post('/profile/cancel/confirm/:id', isLoggedIn, wrapAsync(userController.confirmCancellation));

/**
 * @swagger
 * /listings/{id}/book:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking for a listing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Booking created
 */
router.post('/listings/:id/book', isLoggedIn, wrapAsync(userController.createBooking));

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Profile]
 *     summary: Get owner dashboard data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', isLoggedIn, wrapAsync(userController.ownerDashboard));

/**
 * @swagger
 * /api/profile/cancel/{id}/details:
 *   get:
 *     tags: [Bookings]
 *     summary: Get cancellation details for a booking
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cancellation details
 */
router.get('/api/profile/cancel/:id/details', isLoggedIn, wrapAsync(userController.getCancellationDetails));

/**
 * @swagger
 * /api/profile/cancel/{id}/confirm:
 *   post:
 *     tags: [Bookings]
 *     summary: Confirm cancellation via AJAX
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cancellation confirmed
 */
router.post('/api/profile/cancel/:id/confirm', isLoggedIn, wrapAsync(userController.confirmCancellationAjax));

/**
 * @swagger
 * /api/membership/activate:
 *   post:
 *     tags: [Membership]
 *     summary: Activate membership via AJAX
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Membership activated
 */
router.post('/api/membership/activate', isLoggedIn, wrapAsync(userController.activateMembershipAjax));

/**
 * @swagger
 * /dashboard/search:
 *   get:
 *     tags: [Profile]
 *     summary: Search the owner dashboard
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/dashboard/search', isLoggedIn, wrapAsync(userController.searchDashboard));

/**
 * @swagger
 * /dashboard/hotels:
 *   get:
 *     tags: [Profile]
 *     summary: Get user's listed hotels
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of user's hotels
 */
router.get('/dashboard/hotels', isLoggedIn, wrapAsync(userController.getUserHotels));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *       403:
 *         description: Admin access required
 */
router.get('/admin/dashboard', isLoggedIn, wrapAsync(userController.adminDashboard));

module.exports = router;