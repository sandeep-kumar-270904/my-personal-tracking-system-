const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },
  company: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  round: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['ONLINE', 'INPERSON', 'VIDEO'],
    default: 'VIDEO'
  },
  notes: {
    type: String,
  },
  prepBrief: {
    type: String,
  },
  questionsAsked: [{
    type: String
  }],
  prepNotes: {
    type: String,
    default: '',
  },
  debrief: {
    type: String,
    default: '',
  },
  interviewer: {
    type: String,
    default: '',
  },
  followUpDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'COMPLETED', 'REJECTED'],
    default: 'UPCOMING',
  },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
