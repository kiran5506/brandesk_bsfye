const mongoose = require('mongoose');

const leadAssignmentSchema = new mongoose.Schema(
  {
    inquiry_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerInquiry',
      required: true
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor',
      required: true
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'customer',
      required: true
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: false
    },
    city_name: {
      type: String,
      required: false
    },
    status: {
      type: String,
       enum: ['assigned', 'viewed', 'accepted', 'rejected', 'replace_requested', 'replaced', 'expired'],
      default: 'assigned'
    },
    assigned_at: {
      type: Date,
      default: Date.now
    },
    last_assigned_at: {
      type: Date,
      default: Date.now
    },
    viewed_at: {
      type: Date,
      required: false
    },
    responded_at: {
      type: Date,
      required: false
    },
     replacement_requested_at: {
       type: Date,
       required: false
     },
    credits_deducted: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

leadAssignmentSchema.index({ inquiry_id: 1, vendor_id: 1 }, { unique: true });
leadAssignmentSchema.index({ vendor_id: 1, assigned_at: -1 });

module.exports = mongoose.model('LeadAssignment', leadAssignmentSchema);
