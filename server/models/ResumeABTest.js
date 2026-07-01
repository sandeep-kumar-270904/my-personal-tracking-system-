const mongoose = require('mongoose');

const resumeABTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  resumeAId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resume'
  },
  resumeBId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resume'
  },
  roleType: {
    type: String,
    required: true
  },
  sampleSize: {
    type: Number,
    required: true,
    default: 10
  },
  winnerResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  results: {
    type: Object // JSON containing live stats: { a: { shortlists: 2, total: 5 }, b: { shortlists: 1, total: 4 }, significance: false }
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeABTest', resumeABTestSchema);
