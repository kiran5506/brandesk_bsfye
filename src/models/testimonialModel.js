const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
