const mongoose = require('mongoose');

const resumeHealthAlertSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resume'
  },
  alertType: {
    type: String,
    enum: ['STALE', 'UNUSED', 'SCORE_DECLINING', 'MISSING_SKILLS', 'MISSING_SECTIONS', 'REFERRAL_RISK'],
    required: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeHealthAlert', resumeHealthAlertSchema);
