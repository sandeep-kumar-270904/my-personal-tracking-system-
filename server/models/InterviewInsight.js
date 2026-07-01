const mongoose = require('mongoose');

const interviewInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  insightType: {
    type: String,
    enum: ['STRENGTH', 'WEAKNESS', 'PATTERN', 'IMPROVEMENT', 'MILESTONE'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  evidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  },
  isDismissed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewInsight', interviewInsightSchema);
