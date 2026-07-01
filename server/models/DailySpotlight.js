const mongoose = require('mongoose');

const dailySpotlightSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  isManual: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// Ensure only one spotlight per day
dailySpotlightSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('DailySpotlight', dailySpotlightSchema);
