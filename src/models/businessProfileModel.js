const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema({
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    address: {
        doorNumber: String,
        area: String,
        landmark: String,
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        }
    },
    skills: {
        type: [String],
        default: []
    },
    languages: {
        type: [String],
        default: []
    },
    documents: {
        aadharFront: String,
        aadharBack: String,
        registrationCopy: String,
        gst: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
