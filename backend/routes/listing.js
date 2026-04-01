const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
// Removed expressError import as it's not used directly here
const { isLoggedIn, isOwnerOrAdmin, validateListing, requireManager } = require('../middleware');
const listingController = require('../controllers/listing');

/**
 * @swagger
 * /listings:
 *   get:
 *     tags: [Listings]
 *     summary: Get all listings
 *     responses:
 *       200:
 *         description: Array of all listings
 *   post:
 *     tags: [Listings]
 *     summary: Create a new listing
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: Listing created
 *       401:
 *         description: Not authenticated
 */
router.route('/')
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, requireManager, validateListing, wrapAsync(listingController.create));

/**
 * @swagger
 * /listings/search:
 *   get:
 *     tags: [Listings]
 *     summary: Search listings
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', wrapAsync(listingController.search));

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Get a single listing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing details
 *       404:
 *         description: Listing not found
 *   put:
 *     tags: [Listings]
 *     summary: Update a listing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Listing updated
 *   delete:
 *     tags: [Listings]
 *     summary: Delete a listing
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
 *         description: Listing deleted
 */
router.route('/:id')
    .get(wrapAsync(listingController.show))
    .put(isLoggedIn, isOwnerOrAdmin, validateListing, wrapAsync(listingController.update))
    .delete(isLoggedIn, isOwnerOrAdmin, wrapAsync(listingController.delete));

module.exports = router;