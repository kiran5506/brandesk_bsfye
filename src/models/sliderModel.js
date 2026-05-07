const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
  bannerDesktop: {type: String,required: true },
  //bannerMobile: { type: String, required: true },
  linkTitle: { type: String, required: false, default: "" },
  linkUrl: { type: String,  required: false, default: "" },
  description: {type: String, required: false, default: ""},
  isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Slider', sliderSchema);
