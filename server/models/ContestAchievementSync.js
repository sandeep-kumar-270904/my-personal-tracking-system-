const mongoose = require('mongoose');

const contestAchievementSyncSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  syncStatus: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS'
  }
}, { timestamps: true });

module.exports = mongoose.model('ContestAchievementSync', contestAchievementSyncSchema);
