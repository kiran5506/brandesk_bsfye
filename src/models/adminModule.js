const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    first_name: {type: String,required: true },
    last_name: {type: String, required: false, default: '' },
    mobile_number: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    profile_image: { type: String, required: false },
    password: { type: String,  required: false },
    role: { type: String, default: 'admin' },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('admin', adminSchema);
