const mongoose = require('mongoose');

const outreachMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Network',
    required: true
  },
  messageType: {
    type: String,
    enum: ['INITIAL_CONTACT', 'FOLLOW_UP', 'THANK_YOU', 'REFERRAL_REQUEST', 'UPDATE_SHARE', 'CHECK_IN', 'CONGRATULATIONS'],
    required: true
  },
  channel: {
    type: String,
    enum: ['LINKEDIN', 'EMAIL', 'WHATSAPP', 'TWITTER', 'IN_PERSON', 'PHONE'],
    required: true
  },
  messageContent: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  responseReceived: {
    type: Boolean,
    default: false
  },
  responseContent: {
    type: String
  },
  responseReceivedAt: {
    type: Date
  },
  responseTime: {
    type: Number // in hours
  },
  sentimentAnalysis: {
    type: String,
    enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE']
  },
  aiGenerated: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('OutreachMessage', outreachMessageSchema);
