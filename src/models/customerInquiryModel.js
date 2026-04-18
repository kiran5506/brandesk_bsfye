const mongoose = require('mongoose');

const customerInquirySchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'customer', required: true },
  enquiry_type: { type: String, enum: ['callback', 'enquiry'], required: true },
  city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'city', required: false },
  city_name: { type: String, required: false },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false },
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: 'leadPackage', required: false },
  enquiry_date: { type: Date, required: false },
  OTP: { type: String, required: false },
  is_verified: { type: Boolean, default: false },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerInquiry', customerInquirySchema);
