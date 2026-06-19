const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  weekStartDate: {
    type: Date,
    required: true,
    default: function() {
      const d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - d.getDay()); // Sunday
      return d;
    }
  },
  applicationsTarget: {
    type: Number,
    default: 10
  },
  applicationsCompleted: {
    type: Number,
    default: 0
  },
  dsaTarget: {
    type: Number,
    default: 5
  },
  dsaCompleted: {
    type: Number,
    default: 0
  },
  networkingTarget: {
    type: Number,
    default: 3
  },
  networkingCompleted: {
    type: Number,
    default: 0
  },
  resumeHealthTarget: {
    type: Number,
    default: 2
  },
  resumeHealthCompleted: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

goalSchema.plugin(timelinePlugin);

module.exports = mongoose.model('Goal', goalSchema);
