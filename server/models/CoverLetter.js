const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume' // Optional, could be from a specific resume or generic
  },
  targetCompany: {
    type: String,
    required: true
  },
  targetRole: {
    type: String,
    required: true
  },
  tone: {
    type: String,
    default: 'Professional'
  },
  wordCount: {
    type: Number
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CoverLetter', coverLetterSchema);
