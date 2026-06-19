const mongoose = require('mongoose');

const dsaPatternMasterySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  patternTag: {
    type: String,
    required: true,
  },
  problemsSolved: {
    type: Number,
    default: 0
  },
  avgConfidence: {
    type: Number, // mapped to 1-4
    default: 0
  },
  avgTimeToSolve: {
    type: Number,
    default: 0
  },
  masteryLevel: {
    type: String,
    enum: ['NOT_STARTED', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERED'],
    default: 'NOT_STARTED'
  },
  lastPracticed: {
    type: Date,
    default: null
  },
  decayScore: {
    type: Number, // 0-100
    default: 0
  }
}, { timestamps: true });

// Ensure unique pattern per user
dsaPatternMasterySchema.index({ userId: 1, patternTag: 1 }, { unique: true });

module.exports = mongoose.model('DSAPatternMastery', dsaPatternMasterySchema);
