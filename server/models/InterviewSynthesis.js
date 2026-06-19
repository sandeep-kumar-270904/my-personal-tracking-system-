const mongoose = require('mongoose');

const interviewSynthesisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  interviewCount: { type: Number, required: true },
  strongestArea: { type: String },
  weakestArea: { type: String },
  biggestImprovement: { type: String },
  topPriority: { type: String },
  fullReport: { type: String },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('InterviewSynthesis', interviewSynthesisSchema);
