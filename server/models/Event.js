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
    enum: ['interview', 'application_deadline', 'offer_deadline', 'event', 'deadline', 'academic', 'follow_up', 'post_acceptance_task'],
    default: 'event'
  },
  source: {
    type: String,
    enum: ['manual', 'interview', 'application', 'offer', 'post_acceptance_task'],
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
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  followUpNudgeSent: {
    type: Boolean,
    default: false
  },
  reflection: {
    outcome: { type: String, enum: ['cleared', 'rejected', 'awaiting_result', 'withdrew', 'none'], default: 'none' },
    confidence: { type: Number, min: 1, max: 5 },
    note: { type: String, default: '' }
  },
  highStakesRemindersSent: {
    oneWeek: { type: Boolean, default: false },
    oneDay: { type: Boolean, default: false },
    twoHours: { type: Boolean, default: false }
  },
  disableReminderEscalation: {
    type: Boolean,
    default: false
  },
  is_official_drive: {
    type: Boolean,
    default: false
  },
  expected_response_date: {
    type: Date,
    default: null
  },
  ghosting_nudge_sent: {
    type: Boolean,
    default: false
  },
  response_received: {
    type: Boolean,
    default: false
  },
  response_follow_up_sent: {
    type: Boolean,
    default: false
  },
  company_name: {
    type: String,
    default: ''
  },
  meeting_link: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    enum: ['online', 'on_campus', 'off_campus', ''],
    default: ''
  },
  visibility_filters: {
    branch: { type: [String], default: [] },
    gradYear: { type: [String], default: [] }
  },
  checklist_items: [{
    id: String,
    label: String,
    checked: { type: Boolean, default: false }
  }],
  logistics: {
    travel_booked: { type: Boolean, default: false },
    accommodation_booked: { type: Boolean, default: false },
    documents_printed: { type: Boolean, default: false }
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);

