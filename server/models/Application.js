const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['APPLIED', 'OA_PENDING', 'OA_DONE', 'INTERVIEW_SCHEDULED', 'SHORTLISTED', 'REJECTED', 'OFFER'],
    default: 'APPLIED'
  },
  dateApplied: {
    type: Date,
    required: true,
    default: Date.now
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  notes: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: ''
  },
  jobDescriptionUrl: {
    type: String,
    default: ''
  },
  ctcOffered: {
    type: Number,
  },
  followUpDate: {
    type: Date,
  },
  source: {
    type: String,
    enum: ['CAMPUS', 'ONLINE', 'REFERRAL', 'COLD_EMAIL', 'LINKEDIN', 'JOB_PORTAL'],
    default: 'ONLINE'
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  tags: [{
    type: String
  }],
  fitScore: {
    type: Number,
    default: 0
  },
  fitScoreBreakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  rejectionAnalysis: {
    reason: String,
    improvementArea: String,
    actionableFeedback: String,
    analyzedAt: {
      type: Date,
      default: Date.now
    }
  },
  // V3 Addons
  momentumScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  momentumDecay: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  effortMinutes: {
    type: Number,
    default: 0
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Application', applicationSchema);
