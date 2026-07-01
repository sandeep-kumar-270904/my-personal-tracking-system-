const mongoose = require('mongoose');

const resumePerformanceCacheSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalApplications: {
    type: Number,
    default: 0
  },
  shortlistedCount: {
    type: Number,
    default: 0
  },
  rejectedCount: {
    type: Number,
    default: 0
  },
  averageFitScore: {
    type: Number,
    default: 0
  },
  topRoles: [{
    role: String,
    count: Number
  }],
  topCompanies: [{
    company: String,
    count: Number
  }],
  topSources: [{
    source: String,
    count: Number
  }],
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// We can add an index to automatically expire the cache after some time, e.g. 24 hours
// resumePerformanceCacheSchema.index({ lastCalculatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ResumePerformanceCache', resumePerformanceCacheSchema);
