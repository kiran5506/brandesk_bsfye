const mongoose = require('mongoose');

const customerInquirySchema = new mongoose.Schema({
  customer_name: { 
    type: String, 
    required: true 
  },
  customer_mobile: { 
    type: String, 
    required: true,
    match: /^[0-9]{10}$/  // Validation for 10-digit phone number
  },
  city: { 
    type: String, 
    required: false 
  },
  event_date: { 
    type: Date, 
    required: true 
  },
  OTP: { 
    type: String 
  },
  is_verified: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerInquiry', customerInquirySchema);
