const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  targetCompany: {
    type: String,
    default: ''
  },
  targetRole: {
    type: String,
    default: ''
  },
  roundType: {
    type: String,
    enum: ['ONLINE_ASSESSMENT', 'TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'HR', 'CASE_STUDY', 'GROUP_DISCUSSION', 'APTITUDE'],
    default: 'TECHNICAL'
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  conductedWith: {
    type: String,
    enum: ['SELF', 'PEER', 'MENTOR', 'AI'],
    default: 'SELF'
  },
  performanceScore: {
    type: Number, // 0-100
    default: 0
  },
  feedbackNotes: {
    type: String,
    default: ''
  },
  questionsUsed: [{
    type: mongoose.Schema.Types.Mixed // Array of question objects
  }],
  // Legacy fields
  interviewType: { type: Number },
  problemsAttempted: { type: Array, default: [] },
  weaknessesExposed: { type: [String], default: [] },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
