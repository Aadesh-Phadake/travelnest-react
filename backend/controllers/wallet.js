const User = require('../models/user');
const Transaction = require('../models/transaction');
const { redeemPointsSchema } = require('../schema');
const wrapAsync = require('../utils/wrapAsync');
const expressError = require('../utils/expressError');

// Get wallet data for traveller
module.exports.getWallet = wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id).select('walletBalance rewardPoints');
    if (!user) {
        throw new expressError(404, 'User not found');
    }
    res.json({
        walletBalance: user.walletBalance,
        rewardPoints: user.rewardPoints
    });
});

// Redeem points for discount
module.exports.redeemPoints = wrapAsync(async (req, res) => {
    const { error } = redeemPointsSchema.validate(req.body);
    if (error) {
        throw new expressError(400, error.details[0].message);
    }

    const { points } = req.body;
    const discountAmount = Math.floor(points / 20); // 100 points = ₹5 discount
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new expressError(404, 'User not found');
    }

    if (user.rewardPoints < points) {
        throw new expressError(400, 'Insufficient reward points');
    }

    if (points < 20) {
        throw new expressError(400, 'Minimum 20 points required for redemption');
    }

    // Deduct points and add to wallet balance
    user.rewardPoints -= points;
    user.walletBalance += discountAmount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
        user: req.user._id,
        type: 'redeem',
        amount: discountAmount,
        description: `Redeemed ${points} points for ₹${discountAmount} discount`
    });
    await transaction.save();

    res.json({
        message: 'Points redeemed successfully',
        newBalance: user.walletBalance,
        remainingPoints: user.rewardPoints
    });
});

// Get transaction history
module.exports.getTransactions = wrapAsync(async (req, res) => {
    const transactions = await Transaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to last 50 transactions

    res.json({ transactions });
});
