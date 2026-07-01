const mongoose = require('mongoose');

const interviewResumeSignalSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  signalType: {
    type: String,
    enum: ['POSITIVE', 'NEGATIVE', 'MISSING_SKILL', 'STRENGTH_CONFIRMED'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewResumeSignal', interviewResumeSignalSchema);
