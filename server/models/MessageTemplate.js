const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateName: {
    type: String,
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
  template: {
    type: String,
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  responseRate: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
