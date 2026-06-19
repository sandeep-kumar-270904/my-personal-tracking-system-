const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const dsaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    default: 'MEDIUM',
  },
  platform: {
    type: String,
    enum: ['LEETCODE', 'GFG', 'CODEFORCES', 'OTHER'],
    default: 'LEETCODE'
  },
  solvedAt: {
    type: Date,
    default: Date.now
  },
  companyTag: {
    type: String,
    default: ''
  },
  url: { // Acts as problemUrl
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  
  // V4 Additions for Intelligence System
  title: {
    type: String,
  },
  timeToSolve: {
    type: Number, // in minutes
    default: null
  },
  personalDifficulty: {
    type: Number, // 1-10 scale
    default: null
  },
  attemptCount: {
    type: Number,
    default: 1
  },
  confidenceLevel: {
    type: String,
    enum: ['SHAKY', 'OKAY', 'SOLID', 'MASTERED'],
    default: 'OKAY'
  },
  reviewDue: {
    type: Date,
    default: null
  },
  lastReviewedAt: {
    type: Date,
    default: null
  },
  reviewInterval: {
    type: Number, // internal for spaced repetition
    default: null
  },
  patternTags: {
    type: [String],
    default: []
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  solvedDuringContest: {
    type: Boolean,
    default: false
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    default: null
  },
  autoImported: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const axios = require('axios');

dsaSchema.plugin(timelinePlugin);

dsaSchema.post('save', async function(doc) {
  try {
    // Fire and forget background sync
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/resumes/sync-dsa-skills`, {
      userId: doc.userId,
      topic: doc.topic
    }).catch(err => console.error("Background DSA sync failed:", err.message));
  } catch (error) {
    console.error("Error triggering DSA skill sync:", error);
  }
});

module.exports = mongoose.model('DSA', dsaSchema);
