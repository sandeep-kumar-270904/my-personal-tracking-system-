const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
  skillName: { type: String, required: true },
  preInterviewConfidence: { type: Number, min: 1, max: 5 },
  interviewerProbeDepth: { type: String, enum: ['SURFACE', 'MODERATE', 'DEEP', 'VERY_DEEP'] },
  performedWell: { type: Boolean },
  gapScore: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('SkillCalibrationLog', schema);
