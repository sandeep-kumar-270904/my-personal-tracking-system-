const mongoose = require('mongoose');

const dsaTopicSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  topicName: {
    type: String,
    required: true,
  },
  totalProblems: {
    type: Number,
    default: 0
  },
  solvedCount: {
    type: Number,
    default: 0
  },
  weaknessScore: {
    type: Number, // 0-100
    default: 0
  },
  lastPracticed: {
    type: Date,
    default: null
  },
  masteryLevel: {
    type: String,
    enum: ['NOT_STARTED', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERED'],
    default: 'NOT_STARTED'
  },
  decayScore: {
    type: Number, // 0-100
    default: 0
  }
}, { timestamps: true });

// Ensure unique topic per user
dsaTopicSchema.index({ userId: 1, topicName: 1 }, { unique: true });

module.exports = mongoose.model('DSATopic', dsaTopicSchema);
