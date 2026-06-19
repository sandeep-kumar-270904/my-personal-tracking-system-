const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  roundType: {
    type: String,
    enum: ['ONLINE_ASSESSMENT', 'TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'HR', 'CASE_STUDY', 'GROUP_DISCUSSION', 'APTITUDE']
  },
  question: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['TECHNICAL', 'BEHAVIORAL', 'DSA', 'SYSTEM_DESIGN', 'HR']
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD']
  },
  userAnswer: {
    type: String,
    default: ''
  },
  wasAnsweredWell: {
    type: Boolean,
    default: false
  },
  betterAnswer: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
