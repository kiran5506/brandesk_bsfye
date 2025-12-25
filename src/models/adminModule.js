const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    first_name: {type: String,required: true },
    last_name: {type: String,required: true },
    mobile_number: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String,  required: false },
    role: { type: String, default: 'admin' },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('admin', adminSchema);
