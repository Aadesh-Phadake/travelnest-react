const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
// Removed expressError import as it's not used directly here
const { isLoggedIn, isOwnerOrAdmin, validateListing, requireManager } = require('../middleware');
const listingController = require('../controllers/listing');

// Root: /listings
router.route('/')
    .get(wrapAsync(listingController.index)) // Returns all listings as JSON
    .post(isLoggedIn, requireManager, validateListing, wrapAsync(listingController.create)); // API to create listing

// Search
router.get('/search', wrapAsync(listingController.search));

// REMOVED: router.get('/new') -> React handles the "Create New" form UI

// Specific Listing: /listings/:id
router.route('/:id')
    .get(wrapAsync(listingController.show)) // Returns single listing details as JSON
    .put(isLoggedIn, isOwnerOrAdmin, validateListing, wrapAsync(listingController.update)) // API to update
    .delete(isLoggedIn, isOwnerOrAdmin, wrapAsync(listingController.delete)); // API to delete

// REMOVED: router.get('/:id/edit') -> React handles the "Edit" form UI

module.exports = router;