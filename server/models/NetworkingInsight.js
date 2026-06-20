const mongoose = require('mongoose');

const networkingInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  insightType: {
    type: String,
    enum: ['OUTREACH_PATTERN', 'RESPONSE_RATE', 'RELATIONSHIP_DECAY', 'REFERRAL_OPPORTUNITY', 'COMPANY_COVERAGE', 'WEAK_TIE_OPPORTUNITY', 'FOLLOW_UP_DUE'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  actionableStep: {
    type: String
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'LOW'
  },
  isDismissed: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('NetworkingInsight', networkingInsightSchema);
