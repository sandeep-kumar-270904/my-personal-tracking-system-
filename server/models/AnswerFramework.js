const mongoose = require('mongoose');

const answerFrameworkSchema = new mongoose.Schema({
  questionCategory: {
    type: String,
    enum: ['BEHAVIORAL', 'TECHNICAL', 'HR', 'SYSTEM_DESIGN', 'CS_FUNDAMENTALS'],
    required: true
  },
  questionPattern: {
    type: String, // e.g. "Tell me about a time when", "What is your greatest weakness"
    required: true
  },
  frameworkName: {
    type: String, // e.g. "STAR", "SOAR", "PREP"
    required: true
  },
  frameworkSteps: [{
    name: String, // e.g. "Situation"
    promptText: String // e.g. "Describe the context..."
  }],
  exampleAnswer: {
    type: String
  },
  whenToUse: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AnswerFramework', answerFrameworkSchema);
