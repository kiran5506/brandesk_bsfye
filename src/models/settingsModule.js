const mongoose = require('mongoose');

const settingsSchema = new  mongoose.Schema({
    logo: { type: String, required: true },
    footer_logo: { type: String, required: true },
    page_title: { type: String, required: true },
    mobile_number: { type: String, required: true },
    email: { type: String, required: true },
    whatsapp_number: { type: String, required: true },
    address: { type: String, required: true },
    why_bsfye: { type: String, required: true },
    google_analytics: { type: String, required: true },
    favicon: { type: String, required: true },
    facebook_url: { type: String, required: false },
    twitter_url: { type: String, required: false },
    instagram_url: { type: String, required: false },
    youtube_url: { type: String, required: false },
    linkdin_url: { type: String, required: false },
},{
    timestamps: true
})

module.exports = mongoose.model('site_settings', settingsSchema);
