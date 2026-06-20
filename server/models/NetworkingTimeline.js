const mongoose = require('mongoose');

const networkingTimelineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  placementSeasonStart: {
    type: Date,
    required: true
  },
  currentPhase: {
    type: Number,
    default: 1
  },
  phase1Targets: {
    type: Object,
    default: {}
  },
  phase2Targets: {
    type: Object,
    default: {}
  },
  phase3Targets: {
    type: Object,
    default: {}
  },
  phase4Targets: {
    type: Object,
    default: {}
  },
  phase5Targets: {
    type: Object,
    default: {}
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('NetworkingTimeline', networkingTimelineSchema);
