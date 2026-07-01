const mongoose = require('mongoose');

const studentInsightCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  data: {
    totalCompletions: Number,
    applicationsSubmitted: Number,
    dsaSolved: Number,
    streak: Number,
    categoryBreakdown: [{
      category: String,
      count: Number
    }],
    activityHeatmap: [{
      date: String,
      count: Number
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentInsightCache', studentInsightCacheSchema);
