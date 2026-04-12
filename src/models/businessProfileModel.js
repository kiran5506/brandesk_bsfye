const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema({
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor',
        required: true
    },
    service_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
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
    about_us: {
        type: String,
        default: ''
    },
    communication_address: {
        type: String,
        default: ''
    },
    cover_images: {
        type: [String],
        default: []
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
