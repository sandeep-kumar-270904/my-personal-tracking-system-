const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  date: {
    type: Date,
    required: true
  },
  start_time: {
    type: String, // format "HH:MM"
    default: ''
  },
  end_time: {
    type: String, // format "HH:MM"
    default: ''
  },
  is_all_day: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['interview', 'application_deadline', 'offer_deadline', 'event', 'deadline'],
    default: 'event'
  },
  source: {
    type: String,
    enum: ['manual', 'interview', 'application', 'offer'],
    default: 'manual'
  },
  source_ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled', 'missed'],
    default: 'upcoming'
  },
  location: {
    type: String,
    default: ''
  },
  reminder_minutes_before: {
    type: Number, // e.g. 15, 30, 60, 1440, or null
    default: null
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  is_recurring: {
    type: Boolean,
    default: false
  },
  recurrence_pattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'none'],
    default: 'none'
  },
  recurrence_end_date: {
    type: Date,
    default: null
  },
  parent_event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  end_date: {
    type: Date,
    default: null
  },
  googleEventId: {
    type: String,
    default: null
  },
  is_read_only: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
