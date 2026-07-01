const mongoose = require('mongoose');

const resumeFeedbackSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeReview',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  reviewerName: {
    type: String,
    default: 'Anonymous Reviewer'
  },
  comment: {
    type: String,
    required: true,
  },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  resolved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeFeedback', resumeFeedbackSchema);
