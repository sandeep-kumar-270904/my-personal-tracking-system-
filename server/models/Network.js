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
  lastContacted: {
    type: Date
  },
  dsaInsightsShared: {
    type: String,
    default: ''
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

const axios = require('axios');

networkSchema.post('save', async function(doc) {
  if (doc.dsaInsightsShared && doc.dsaInsightsShared.length > 5) {
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/dsa/signals/from-contact`, {
      textShared: doc.dsaInsightsShared,
      companyName: doc.company,
      userId: doc.user
    }).catch(err => console.error("DSA contact signals failed:", err.message));
  }
});

networkSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.dsaInsightsShared && doc.dsaInsightsShared.length > 5) {
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/dsa/signals/from-contact`, {
      textShared: doc.dsaInsightsShared,
      companyName: doc.company,
      userId: doc.user
    }).catch(err => console.error("DSA contact signals failed:", err.message));
  }
});

module.exports = mongoose.model('Network', networkSchema);
