const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet');
const { isLoggedIn, requireTraveller } = require('../middleware');

// All wallet routes require authentication and traveller role
router.use(isLoggedIn);
router.use(requireTraveller);

// GET /wallet - Get wallet balance and points
router.get('/', walletController.getWallet);

// POST /wallet/redeem - Redeem points for discount
router.post('/redeem', walletController.redeemPoints);

// GET /wallet/transactions - Get transaction history
router.get('/transactions', walletController.getTransactions);

module.exports = router;
