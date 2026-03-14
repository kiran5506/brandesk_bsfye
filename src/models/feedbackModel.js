const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vendor',
    required: false
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'customer',
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['vendor', 'user'],
    default: 'vendor'
  },
  mobile_number: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/  // Validation for 10-digit phone number
  },
  feedback: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true,
    enum: [0, 1],  // 0 = pending, 1 = resolved
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
