const mongoose = require('mongoose');

const WeeklyReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  intentionText: {
    type: String,
    required: true
  },
  statsSnapshot: {
    type: mongoose.Schema.Types.Mixed, // JSON of the week's numbers
    default: {}
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WeeklyReview', WeeklyReviewSchema);
