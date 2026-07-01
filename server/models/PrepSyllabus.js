const mongoose = require('mongoose');

const prepSyllabusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  contentUrl: {
    type: String
  },
  topicsCovered: {
    type: [String],
    default: []
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  dsaTopics: [{
    topic: String,
    reason: String
  }],
  recommendedProblems: [{
    title: String,
    difficulty: String,
    link: String
  }],
  behavioralQuestions: [{
    question: String,
    valueTested: String
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const axios = require('axios');

prepSyllabusSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'COMPLETED') {
    axios.post(`http://localhost:${process.env.PORT || 5000}/api/dsa/signals/from-prephub`, {
      syllabusId: doc._id,
      userId: doc.userId
    }).catch(err => console.error("DSA prephub signals failed:", err.message));
  }
});

module.exports = mongoose.model('PrepSyllabus', prepSyllabusSchema);
