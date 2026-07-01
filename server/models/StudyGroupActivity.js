const mongoose = require('mongoose');

const studyGroupActivitySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    enum: ['PROBLEM_SOLVED', 'STREAK_MILESTONE', 'TOPIC_MASTERED', 'MOCK_INTERVIEW_COMPLETED', 'WEAKNESS_RESOLVED'],
    required: true
  },
  metadata: {
    type: Object, // Extra info based on activityType
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('StudyGroupActivity', studyGroupActivitySchema);
