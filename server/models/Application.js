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
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
