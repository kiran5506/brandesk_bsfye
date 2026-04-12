const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
    {
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        business_profile_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: true },
    },
    { timestamps: true }
);

wishlistSchema.index({ customer_id: 1, business_profile_id: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
