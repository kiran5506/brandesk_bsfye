const mongoose = require('mongoose');

const leadPackageSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  service_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  serviceCategories: { type: [String], default: [] },
  totalLeads: { type: Number, required: true },
  amount: { type: Number, required: true },
  image: { type: String, required: true },
  description: { type: String, required: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadPackage', leadPackageSchema);
