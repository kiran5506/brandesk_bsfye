const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  city_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  manual_vendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vendor',
    default: []
  }],
  auto_vendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vendor',
    default: []
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
