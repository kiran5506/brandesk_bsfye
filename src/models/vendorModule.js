const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: {type: String,required: true },
    mobile_number: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String,  required: false },
    acceptTermss: { type: String,  required: false },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('vendor', vendorSchema);
