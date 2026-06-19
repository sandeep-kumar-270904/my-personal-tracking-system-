const mongoose = require('mongoose');

const interviewPatternSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  patternType: {
    type: String,
    enum: ['ALWAYS_ASKED_DSA', 'ALWAYS_BEHAVIORAL', 'SYSTEM_DESIGN_HEAVY', 'HR_NEGOTIATION_FOCUSED', 'SHORT_ROUNDS', 'LONG_ROUNDS', 'MULTIPLE_ROUNDS', 'FAST_REJECTION', 'SLOW_PROCESS'],
    required: true
  },
  company: {
    type: String,
    required: true
  },
  evidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  detectedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewPattern', interviewPatternSchema);
