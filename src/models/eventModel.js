const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  service_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  serviceCategories: { type: [String], required: true },
  image: { type: String, required: true },
  skills: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
