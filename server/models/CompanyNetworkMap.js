const mongoose = require('mongoose');

const companyNetworkMapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  contactCount: {
    type: Number,
    default: 0
  },
  strongConnectionCount: {
    type: Number,
    default: 0
  },
  referralCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  hasInsiderIntel: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Networking V7 Fields
  hasReferralBonus: {
    type: Boolean,
    default: false
  },
  referralBonusAmount: {
    type: String
  },
  bonusContributedByCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('CompanyNetworkMap', companyNetworkMapSchema);
