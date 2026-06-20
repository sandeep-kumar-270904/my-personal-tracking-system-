const mongoose = require('mongoose');

const referralPipelineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Network',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PLANNING', 'REQUESTED', 'REMINDER_SENT', 'RECEIVED', 'DECLINED', 'EXPIRED'],
    default: 'PLANNING'
  },
  requestMessage: {
    type: String
  },
  reminderMessage: {
    type: String
  },
  referralSubmittedAt: {
    type: Date
  },
  outcome: {
    type: String,
    enum: ['PENDING', 'INTERVIEW_RECEIVED', 'REJECTED', 'OFFER', 'NOT_TRACKED'],
    default: 'PENDING'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ReferralPipeline', referralPipelineSchema);
