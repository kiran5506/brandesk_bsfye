const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  serviceCategory: { type: String, required: true },
  image: { type: String, required: true },
  skills: [{ type: String }],
  description: { type: String, required: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
