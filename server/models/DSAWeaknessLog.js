const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const dsaWeaknessLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  topicOrPattern: {
    type: String,
    required: true,
  },
  weaknessType: {
    type: String,
    enum: ['SPEED', 'ACCURACY', 'CONFIDENCE', 'COVERAGE'],
    required: true
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolutionNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

dsaWeaknessLogSchema.plugin(timelinePlugin);

module.exports = mongoose.model('DSAWeaknessLog', dsaWeaknessLogSchema);
