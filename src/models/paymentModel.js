const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'vendor', required: true },
        leadPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadPackage', required: true },
        razorpayOrderId: { type: String, required: true },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        status: {
            type: String,
            enum: ['created', 'paid', 'failed'],
            default: 'created',
        },
        notes: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
