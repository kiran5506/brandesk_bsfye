const mongoose = require('mongoose');

const businessPortfolioSchema = new mongoose.Schema({
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor',
        required: true
    },
    business_profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusinessProfile',
        required: true
    },
    service_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    events: [
        {
            event_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Event',
                required: true
            },
            images: {
                type: [String],
                default: []
            },
            youtube_media: {
                type: [
                    {
                        youtube_url: {
                            type: String,
                            default: ''
                        }
                    }
                ],
                default: []
            }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BusinessPortfolio', businessPortfolioSchema);
