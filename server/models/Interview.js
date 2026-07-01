const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['TECHNICAL', 'BEHAVIORAL', 'DSA', 'SYSTEM_DESIGN', 'HR'] 
  },
  difficulty: { 
    type: String, 
    enum: ['EASY', 'MEDIUM', 'HARD'] 
  },
  userAnswer: { type: String },
  wasAnsweredWell: { type: Boolean, default: false }
});

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },
  company: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  round: {
    type: String,
    required: true,
  },
  roundType: {
    type: String,
    enum: ['ONLINE_ASSESSMENT', 'TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'HR', 'CASE_STUDY', 'GROUP_DISCUSSION', 'APTITUDE'],
    default: 'TECHNICAL'
  },
  type: {
    type: String,
    enum: ['ONLINE', 'INPERSON', 'VIDEO'],
    default: 'VIDEO'
  },
  interviewer: {
    type: String,
    default: '',
  },
  interviewerName: { type: String, default: '' },
  interviewerRole: { type: String, default: '' },
  interviewerLinkedIn: { type: String, default: '' },
  durationMinutes: { type: Number, default: 60 },
  platform: {
    type: String,
    enum: ['ZOOM', 'MEET', 'TEAMS', 'PHONE', 'IN_PERSON', 'HACKERRANK', 'CODEPAIR', 'OTHER'],
    default: 'ZOOM'
  },
  meetingUrl: { type: String, default: '' },
  address: { type: String, default: '' },
  commuteTimeEstimate: { type: Number, default: 0 },
  liveNotes: [{
    timestamp: Date,
    text: String,
    tag: {
      type: String,
      enum: ['GREEN', 'RED', 'YELLOW', 'BLUE']
    }
  }],
  notes: {
    type: String,
  },
  prepBrief: {
    type: String,
  },
  // We keep mixed to support legacy strings or the new object format
  questionsAsked: [mongoose.Schema.Types.Mixed],
  prepNotes: {
    type: String,
    default: '',
  },
  debrief: {
    type: String,
    default: '',
  },
  outcome: {
    type: String,
    enum: ['PENDING', 'PASSED', 'FAILED', 'CANCELLED', 'NO_SHOW', 'AWAITING_RESULT'],
    default: 'PENDING'
  },
  feedbackReceived: { type: String, default: '' },
  offerMade: { type: Boolean, default: false },
  ctcDiscussed: { type: Number },
  followUpDate: {
    type: Date,
  },
  confidenceLevel: { type: Number, min: 1, max: 10 },
  performanceRating: { type: Number, min: 1, max: 10 },
  stressLevel: { type: Number, min: 1, max: 10 },
  linkedinConnected: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED',
  },
}, { timestamps: true });

interviewSchema.plugin(timelinePlugin);

const axios = require('axios');

interviewSchema.post('save', async function(doc) {
  if (doc.debrief && doc.debrief.length > 10) {
    // Fire and forget extraction
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/interviews/${doc._id}/extract-resume-signals`)
         .catch(err => console.error("Resume signal extraction failed:", err.message));
         
    // V4 IX9: 5-Step Loop
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/interviews/v4/intelligence-loop/${doc._id}`)
         .catch(err => console.error("IX9 Intelligence Loop failed:", err.message));
  }
  
  if (doc.outcome === 'PASSED') {
    // V4 IX6: Offer Signal Check
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/interviews/v4/offer-signal-check`, { interviewId: doc._id })
         .catch(err => console.error("Offer signal check failed:", err.message));
  }
  
  // V4: Activate Prep Mode
  axios.post(`http://localhost:${process.env.PORT || 5000}/api/dsa/interviews/${doc._id}/activate-prep-mode`, {
    companyName: doc.company,
    interviewDate: doc.scheduledAt,
    userId: doc.userId
  }).catch(err => console.error("DSA prep mode activation failed:", err.message));
});

interviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.debrief && doc.debrief.length > 10) {
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/interviews/${doc._id}/extract-resume-signals`)
         .catch(err => console.error("Resume signal extraction failed:", err.message));
         
    // V4 IX9: 5-Step Loop
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/interviews/v4/intelligence-loop/${doc._id}`)
         .catch(err => console.error("IX9 Intelligence Loop failed:", err.message));
  }
  
  if (doc && doc.outcome === 'PASSED') {
    // V4 IX6: Offer Signal Check
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/interviews/v4/offer-signal-check`, { interviewId: doc._id })
         .catch(err => console.error("Offer signal check failed:", err.message));
  }
});

module.exports = mongoose.model('Interview', interviewSchema);
