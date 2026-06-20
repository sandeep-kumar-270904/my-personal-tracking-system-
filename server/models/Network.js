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
  },
  firstName: { type: String },
  lastName: { type: String },
  previousCompanies: [{ type: String }],
  college: { type: String },
  graduationYear: { type: Number },
  yearsOfExperience: { type: Number },
  email: { type: String },
  phone: { type: String },
  twitterHandle: { type: String },
  githubUrl: { type: String },
  connectionStrength: { type: String, enum: ['WEAK', 'MODERATE', 'STRONG', 'CLOSE'], default: 'WEAK' },
  contactType: { type: String, enum: ['ALUMNI', 'SENIOR_STUDENT', 'RECRUITER', 'HIRING_MANAGER', 'ENGINEER', 'FOUNDER', 'MENTOR', 'PEER'], default: 'ENGINEER' },
  howMet: { type: String },
  sharedInterests: [{ type: String }],
  mutualConnections: { type: Number, default: 0 },
  lastInteractionAt: { type: Date },
  nextFollowUpAt: { type: Date },
  relationshipHealthScore: { type: Number, default: 0 },
  isReferralSource: { type: Boolean, default: false },
  referralStatus: { type: String, enum: ['NOT_ASKED', 'ASKED', 'AGREED', 'SUBMITTED', 'DECLINED'], default: 'NOT_ASKED' },
  interviewInsightsShared: { type: String },
  companyInsightsShared: { type: String },
  isPublic: { type: Boolean, default: false },
  isMentor: { type: Boolean, default: false },
  tags: [{ type: String }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
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
