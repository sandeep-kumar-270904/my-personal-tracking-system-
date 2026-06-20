const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['INTERVIEW', 'APPLICATION_STALE', 'DSA_REMINDER', 'SYSTEM', 'CALENDAR', 'FOLLOW_UP_NUDGE'],
    default: 'SYSTEM',
  },
  link: {
    type: String,
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
