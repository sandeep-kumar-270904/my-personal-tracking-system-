const mongoose = require('mongoose');
const crypto = require('crypto');

const resumeReviewSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeReview', resumeReviewSchema);
