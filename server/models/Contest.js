const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  startsAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  externalUrl: {
    type: String,
    default: ''
  },
  reminderSet: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Contest', contestSchema);
