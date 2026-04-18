const mongoose = require('mongoose');

const leadReplacementRequestSchema = new mongoose.Schema(
  {
    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeadAssignment',
      required: true
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor',
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'adminModule',
      required: false
    },
    reviewed_at: {
      type: Date,
      required: false
    }
  },
  { timestamps: true }
);

leadReplacementRequestSchema.index({ assignment_id: 1, vendor_id: 1 }, { unique: true });

module.exports = mongoose.model('LeadReplacementRequest', leadReplacementRequestSchema);
