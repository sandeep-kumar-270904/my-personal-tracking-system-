const mongoose = require('mongoose');

const readinessAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  overallReadiness: {
    type: String,
    enum: ['NOT_READY', 'PARTIALLY_READY', 'READY', 'STRONG'],
    required: true,
  },
  readinessScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  passedChecks: {
    type: [String],
    default: []
  },
  failedChecks: {
    type: Array, // Array of objects e.g. { gap: "Not enough Graph problems", estimatedTimeToClose: "4 days" }
    default: []
  },
  estimatedTimeToReady: {
    type: Number, // Days
    default: null
  },
  companySpecificReadiness: {
    type: mongoose.Schema.Types.Mixed, // e.g. { "Google": { readiness: "NOT_READY", gapDetails: "..." } }
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('ReadinessAssessment', readinessAssessmentSchema);
