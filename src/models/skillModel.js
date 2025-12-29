const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  skillName: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
