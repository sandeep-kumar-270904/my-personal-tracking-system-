const mongoose = require('mongoose');

const interviewDSASignalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview', // Assuming an Interview model
    required: true
  },
  dsaTopicsAsked: {
    type: [String],
    default: []
  },
  patternsAsked: {
    type: [String],
    default: []
  },
  struggledAreas: {
    type: [String],
    default: []
  },
  excelledAreas: {
    type: [String],
    default: []
  },
  interviewerFeedback: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String, // Relative to LeetCode Medium
    default: 'MEDIUM'
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewDSASignal', interviewDSASignalSchema);
