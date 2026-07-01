const mongoose = require('mongoose');

const interviewPrepPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  interviewDate: {
    type: Date,
    required: true
  },
  prepPlan: {
    type: Array, // JSON array of day-by-day schedules
    default: []
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure only one active plan per interview
interviewPrepPlanSchema.index({ interviewId: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('InterviewPrepPlan', interviewPrepPlanSchema);
