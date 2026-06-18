const mongoose = require('mongoose');

const unifiedTimelineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceTable: {
    type: String,
    enum: ['APPLICATION', 'INTERVIEW', 'DSA', 'CONTACT', 'OFFER', 'CONTEST', 'RESUME', 'GOAL'],
    required: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('UnifiedTimeline', unifiedTimelineSchema);
