const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

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
  type: {
    type: String,
    enum: ['ONLINE', 'INPERSON', 'VIDEO'],
    default: 'VIDEO'
  },
  notes: {
    type: String,
  },
  prepBrief: {
    type: String,
  },
  questionsAsked: [{
    type: String
  }],
  prepNotes: {
    type: String,
    default: '',
  },
  debrief: {
    type: String,
    default: '',
  },
  interviewer: {
    type: String,
    default: '',
  },
  followUpDate: {
    type: Date,
  },
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
  }
});

interviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.debrief && doc.debrief.length > 10) {
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/interviews/${doc._id}/extract-resume-signals`)
         .catch(err => console.error("Resume signal extraction failed:", err.message));
  }
});

module.exports = mongoose.model('Interview', interviewSchema);
