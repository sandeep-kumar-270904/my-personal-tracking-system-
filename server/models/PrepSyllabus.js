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
  }
}, { timestamps: true });

module.exports = mongoose.model('PrepSyllabus', prepSyllabusSchema);
