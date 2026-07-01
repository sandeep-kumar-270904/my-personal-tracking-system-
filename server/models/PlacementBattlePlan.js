const mongoose = require('mongoose');

const PlacementBattlePlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalTarget: {
    type: Number,
    default: 50
  },
  dreamCompanies: {
    type: [String],
    default: []
  },
  targetCompanies: {
    type: [String],
    default: []
  },
  safeCompanies: {
    type: [String],
    default: []
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  weaknesses: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlacementBattlePlan', PlacementBattlePlanSchema);
