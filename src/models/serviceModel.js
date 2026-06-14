const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  serviceType: { type: String, enum: ['Primary', 'Secondary'], required: true },
  portfolioType: { type: String, enum: ['Multiple', 'Single'], required: true },
  image: { type: String, required: true },
  skills: { type: String, required: false },
  event_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  description: { type: String, required: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
