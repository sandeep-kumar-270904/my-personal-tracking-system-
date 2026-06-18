const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const networkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Contact name is required']
  },
  company: {
    type: String,
    required: [true, 'Company is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required']
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['ALUMNI', 'COLD', 'REFERRAL'],
    default: 'COLD'
  },
  outreachStatus: {
    type: String,
    enum: ['NOT_CONTACTED', 'MESSAGED', 'REPLIED', 'REFERRAL_RECEIVED'],
    default: 'NOT_CONTACTED'
  },
  lastContactDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date
  },
  linkedApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }
}, { timestamps: true });

networkSchema.plugin(timelinePlugin);

module.exports = mongoose.model('Network', networkSchema);
