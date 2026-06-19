const mongoose = require('mongoose');

const dsaMistakeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DSA',
    required: true
  },
  mistakeTypes: [{
    type: String,
    enum: ['WRONG_APPROACH', 'EDGE_CASE_MISSED', 'COMPLEXITY_ERROR', 'IMPLEMENTATION_BUG', 'TIME_MANAGEMENT', 'PATTERN_NOT_RECOGNIZED', 'FORGOT_ALGORITHM']
  }],
  mistakeDescription: {
    type: String,
    required: true
  },
  correctionInsight: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DSAMistake', dsaMistakeSchema);
