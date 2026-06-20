const mongoose = require('mongoose');

const savedPlaySchema = new mongoose.Schema({
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
  savedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure a user can only save a play once
savedPlaySchema.index({ userId: 1, playId: 1 }, { unique: true });

module.exports = mongoose.model('SavedPlay', savedPlaySchema);
