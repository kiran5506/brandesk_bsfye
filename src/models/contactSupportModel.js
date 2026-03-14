const mongoose = require('mongoose');

const contactSupportSchema = new mongoose.Schema({
  mobile_number: { 
    type: String, 
    required: true,
    match: /^[0-9]{10}$/  // Validation for 10-digit phone number
  },
  issue: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['customer', 'vendor'],
    default: 'customer'
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

module.exports = mongoose.model('ContactSupport', contactSupportSchema);
