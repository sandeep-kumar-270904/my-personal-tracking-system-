const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const contestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  startsAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  externalUrl: {
    type: String,
    default: ''
  },
  reminderSet: {
    type: Boolean,
    default: false
  },
  rank: {
    type: Number,
    default: null
  },
  totalParticipants: {
    type: Number,
    default: null
  }
}, { timestamps: true });

contestSchema.plugin(timelinePlugin);

const syncContestAchievement = async function(doc) {
  if (!doc) return;
  // If rank and totalParticipants are provided, and rank is top 10%
  if (doc.rank && doc.totalParticipants && (doc.rank / doc.totalParticipants) <= 0.10) {
    try {
      const ContestAchievementSync = require('./ContestAchievementSync');
      const Resume = require('./Resume');

      // Check if already synced
      const existingSync = await ContestAchievementSync.findOne({ contestId: doc._id });
      if (existingSync) return;

      // Find user's default resume (or latest modified)
      const resume = await Resume.findOne({ user: doc.userId, isArchived: false }).sort({ updatedAt: -1 });
      if (!resume) return;

      // Update resume tags
      const tagString = `Top 10% in ${doc.name} (${doc.platform})`;
      if (!resume.tags) resume.tags = [];
      if (!resume.tags.includes(tagString)) {
        resume.tags.push(tagString);
        await resume.save();
      }

      await ContestAchievementSync.create({
        contestId: doc._id,
        userId: doc.userId,
        resumeId: resume._id,
        syncStatus: 'SUCCESS'
      });
    } catch (err) {
      console.error('Contest achievement sync failed', err);
    }
  }
};

contestSchema.post('save', syncContestAchievement);
contestSchema.post('findOneAndUpdate', syncContestAchievement);

module.exports = mongoose.model('Contest', contestSchema);
