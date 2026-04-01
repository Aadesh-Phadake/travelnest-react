const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet');
const { isLoggedIn, requireTraveller } = require('../middleware');

// All wallet routes require authentication and traveller role
router.use(isLoggedIn);
router.use(requireTraveller);

/**
 * @swagger
 * /wallet:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet balance and reward points
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance and points
 *       401:
 *         description: Not authenticated
 */
router.get('/', walletController.getWallet);

/**
 * @swagger
 * /wallet/redeem:
 *   post:
 *     tags: [Wallet]
 *     summary: Redeem reward points for discount
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: number
 *     responses:
 *       200:
 *         description: Points redeemed successfully
 *       400:
 *         description: Insufficient points
 */
router.post('/redeem', walletController.redeemPoints);

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet transaction history
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of transactions
 */
router.get('/transactions', walletController.getTransactions);

module.exports = router;
