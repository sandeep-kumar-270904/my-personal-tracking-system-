const mongoose = require('mongoose');

const playUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Play',
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Network'
  },
  outcome: {
    type: String,
    enum: ['SUCCESS', 'PARTIAL', 'NO_RESPONSE', 'TOO_EARLY_TO_TELL'],
    default: 'TOO_EARLY_TO_TELL'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('PlayUsage', playUsageSchema);
