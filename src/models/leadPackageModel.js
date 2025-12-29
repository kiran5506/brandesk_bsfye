const mongoose = require('mongoose');

const leadPackageSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  totalLeads: { type: Number, required: true },
  amount: { type: Number, required: true },
  image: { type: String, required: true },
  description: { type: String, required: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadPackage', leadPackageSchema);
