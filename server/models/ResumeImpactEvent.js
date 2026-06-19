const mongoose = require('mongoose');

const resumeImpactEventSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Applied', 'Interviewing', 'Offer', 'Rejected'],
    default: 'Applied',
  },
  dateApplied: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeImpactEvent', resumeImpactEventSchema);
