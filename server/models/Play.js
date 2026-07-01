const mongoose = require('mongoose');

const playSchema = new mongoose.Schema({
  playName: { type: String, required: true },
  tagline: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['COLD_OUTREACH', 'WARM_CONVERSION', 'REFERRAL', 'COMMUNITY', 'INTEL_GATHERING', 'POST_REJECTION', 'COUNTER_INTUITIVE', 'TIMELINE_CRITICAL', 'PAY_FORWARD'],
    required: true
  },
  difficulty: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], required: true },
  impactScore: { type: Number, min: 1, max: 10, required: true },
  timeToExecute: { type: String, required: true },
  whenToUse: { type: String, required: true },
  theInsight: { type: String, required: true },
  thePlay: { type: String, required: true },
  successMetric: { type: String, required: true },
  warningLabel: { type: String },
  platformAverage: { type: Number, default: 0 },
  contributedBy: { type: String, default: 'Platform' },
  isApproved: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  savedByCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Play', playSchema);
