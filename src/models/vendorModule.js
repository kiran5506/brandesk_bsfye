const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: {type: String,required: true },
    mobile_number: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String,  required: false },
    address: { type: String, required: false },
    profile_image: { type: String, required: false },
    is_otp_verified: { type: Boolean, default: false },
    otp_code: { type: String, required: false },
    is_profile_completed: { type: Boolean, default: false },
    is_profile_verified: { type: Boolean, default: false },
    profile_status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    approved_date: { type: Date, required: false },
    rejected_date: { type: Date, required: false },
    credits: { type: Number, default: 0, required: false },
    acceptTerms: { type: String,  required: false },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('vendor', vendorSchema);
