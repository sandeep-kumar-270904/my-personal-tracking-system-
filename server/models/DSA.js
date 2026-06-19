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
    enum: ['LEETCODE', 'GFG', 'CODEFORCES'],
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
  url: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const axios = require('axios');

dsaSchema.plugin(timelinePlugin);

dsaSchema.post('save', async function(doc) {
  try {
    // Fire and forget background sync
    // In production, you'd use a message queue, but here we call the local endpoint or logic
    // Since we're in the same app, it's safer to just require the controller logic directly if possible,
    // or make an HTTP request. Let's make an HTTP request to the new endpoint.
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/resumes/sync-dsa-skills`, {
      userId: doc.userId,
      topic: doc.topic
    }).catch(err => console.error("Background DSA sync failed:", err.message));
  } catch (error) {
    console.error("Error triggering DSA skill sync:", error);
  }
});

module.exports = mongoose.model('DSA', dsaSchema);
