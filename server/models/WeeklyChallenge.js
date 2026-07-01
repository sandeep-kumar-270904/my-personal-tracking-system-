const mongoose = require('mongoose');

const weeklyChallengeSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  requiredCompletions: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyChallenge', weeklyChallengeSchema);
