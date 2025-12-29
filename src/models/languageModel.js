const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  languageName: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Language', languageSchema);
