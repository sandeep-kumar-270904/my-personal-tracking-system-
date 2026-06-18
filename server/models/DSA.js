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

dsaSchema.plugin(timelinePlugin);

module.exports = mongoose.model('DSA', dsaSchema);
