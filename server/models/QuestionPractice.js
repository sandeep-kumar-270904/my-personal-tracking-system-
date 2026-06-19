const mongoose = require('mongoose');

const questionPracticeSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resume'
  },
  question: {
    type: String,
    required: true
  },
  userAnswer: {
    type: String,
    required: true
  },
  aiScore: {
    type: Number,
    required: true
  },
  aiFeedback: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('QuestionPractice', questionPracticeSchema);
