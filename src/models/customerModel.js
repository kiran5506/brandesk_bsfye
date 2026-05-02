const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile_number: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    is_otp_verified: { type: Boolean, default: false },
    otp_code: { type: String, required: false },
    password_reset_verified: { type: Boolean, default: false },
    type: { type: String, enum: ['direct', 'enquiry', 'callback'], required: true, default: 'direct' },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('customer', customerSchema);
