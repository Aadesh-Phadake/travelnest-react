const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['earn', 'redeem', 'spend'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// ===== DATABASE INDEXES =====
transactionSchema.index({ user: 1, createdAt: -1 });  // User transaction history sorted
transactionSchema.index({ type: 1 });                  // Filter by transaction type

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
