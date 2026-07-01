const mongoose = require('mongoose');

const weeklyBriefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  briefContent: {
    type: String,
    required: true
  },
  isDismissed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyBrief', weeklyBriefSchema);
