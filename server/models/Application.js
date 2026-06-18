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
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
