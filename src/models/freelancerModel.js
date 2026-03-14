const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        required: true
    },
    services: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },
    languages: {
        type: [String],
        default: []
    },
    images: {
        type: [String],
        default: []
    },
    videos: {
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

module.exports = mongoose.model('Freelancer', freelancerSchema);
