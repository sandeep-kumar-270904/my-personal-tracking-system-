const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const dsaStudySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  startedAt: {
    type: Date,
    required: true,
  },
  endedAt: {
    type: Date,
    default: null
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  problemsAttempted: {
    type: Number,
    default: 0
  },
  problemsSolved: {
    type: Number,
    default: 0
  },
  topicsFocused: {
    type: [String],
    default: []
  },
  focusScore: {
    type: Number, // 0-100
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  startHour: {
    type: Number,
    min: 0,
    max: 23,
    default: null
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    default: null
  },
  problemsPerHour: {
    type: Number,
    default: 0
  },
  bestFocusStreak: {
    type: Number, // in minutes
    default: 0
  }
}, { timestamps: true });

dsaStudySessionSchema.plugin(timelinePlugin);

module.exports = mongoose.model('DSAStudySession', dsaStudySessionSchema);
