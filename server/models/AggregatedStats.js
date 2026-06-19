const mongoose = require('mongoose');

const aggregatedStatsSchema = new mongoose.Schema({
  cohortYear: {
    type: String, // e.g. "2027"
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  avgApplications: {
    type: Number,
    default: 0
  },
  avgDSASolved: {
    type: Number,
    default: 0
  },
  avgInterviewConversion: {
    type: Number, // Percentage 0-100
    default: 0
  },
  totalUsersSampled: {
    type: Number,
    default: 0
  },
  avgATSScore: {
    type: Number,
    default: 0
  },
  avgQuantifiedAchievements: {
    type: Number,
    default: 0
  },
  avgSkillsCount: {
    type: Number,
    default: 0
  },
  avgSectionCompleteness: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// We usually want only one record per cohort per day.
aggregatedStatsSchema.index({ cohortYear: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AggregatedStats', aggregatedStatsSchema);
