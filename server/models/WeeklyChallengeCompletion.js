const mongoose = require('mongoose');

const weeklyChallengeCompletionSchema = new mongoose.Schema({
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyChallenge',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

weeklyChallengeCompletionSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyChallengeCompletion', weeklyChallengeCompletionSchema);
