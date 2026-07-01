const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
  questionAsked: { type: String },
  studentAnswer: { type: String },
  aiDepthAssessment: { type: String, enum: ['TOO_BRIEF', 'JUST_RIGHT', 'TOO_DETAILED'] },
  interviewerSimulatedReaction: { type: String },
  adjustmentMade: { type: Boolean }
}, { timestamps: true });

module.exports = mongoose.model('DetailCalibrationLog', schema);
