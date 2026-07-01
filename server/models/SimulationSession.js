const mongoose = require('mongoose');

const simulationSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  simulationType: {
    type: String,
    enum: ['VIDEO', 'WHITEBOARD', 'PHONE'],
    required: true
  },
  targetCompany: String,
  targetRole: String,
  roundType: String,
  questionsAsked: [{
    questionText: String,
    timestamp: Date
  }],
  studentResponses: [{
    responseText: String, // from text input or speech-to-text
    timestamp: Date
  }],
  performanceReport: {
    type: String
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('SimulationSession', simulationSessionSchema);
