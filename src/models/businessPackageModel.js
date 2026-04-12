const mongoose = require('mongoose');

const cityPricingSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    marketPrice: {
        type: Number,
        default: 0
    },
    offerPrice: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    }
}, { _id: false });

const businessPackageSchema = new mongoose.Schema({
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor',
        required: true
    },
    service_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: false
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    packageName: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    cityPricing: {
        type: [cityPricingSchema],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BusinessPackage', businessPackageSchema);
