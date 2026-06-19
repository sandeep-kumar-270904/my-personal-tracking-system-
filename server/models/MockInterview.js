const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  interviewType: {
    type: Number, // e.g., 45, 60, 90 (minutes)
    required: true,
  },
  targetCompany: {
    type: String,
    default: ''
  },
  problemsAttempted: {
    type: Array, // Array of problem objects { title, difficulty, userApproach, timeComplexity, spaceComplexity }
    default: []
  },
  overallScore: {
    type: Number, // 0-100
    default: 0
  },
  weaknessesExposed: {
    type: [String], // Array of strings (e.g., 'Time Complexity Analysis', 'Dynamic Programming Optimization')
    default: []
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
