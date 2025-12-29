const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  language: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tutorial', tutorialSchema);
