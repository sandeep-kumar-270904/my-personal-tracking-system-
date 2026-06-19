const mongoose = require('mongoose');

const dsaBehaviorAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysisDate: {
    type: Date,
    default: Date.now
  },
  behaviorPatterns: [{
    patternName: { type: String, enum: ['AVOIDANCE', 'PLATEAU', 'EASY_GRINDING', 'BINGE_PRACTICE', 'SPEED_RUSHING'] },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    description: String,
    insight: String,
    actionableAdvice: String
  }],
  insights: [String] // Generic additional insights
}, { timestamps: true });

module.exports = mongoose.model('DSABehaviorAnalysis', dsaBehaviorAnalysisSchema);
