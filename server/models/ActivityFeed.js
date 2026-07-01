const mongoose = require('mongoose');

const activityFeedSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    enum: ['COMPLETED_RESOURCE', 'LOGGED_INTERVIEW', 'ACHIEVED_STREAK', 'EARNED_BADGE', 'ADDED_APPLICATION'],
    required: true 
  },
  metadata: {
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    resourceTitle: String,
    company: String,
    role: String,
    streakDays: Number,
    badgeName: String
  },
  createdAt: { type: Date, default: Date.now }
});

activityFeedSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityFeed', activityFeedSchema);
