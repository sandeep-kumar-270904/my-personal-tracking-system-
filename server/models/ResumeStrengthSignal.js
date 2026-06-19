const mongoose = require('mongoose');

const resumeStrengthSignalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  resumeElement: { type: String, required: true }, // The specific thing referenced (e.g. project name)
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
  company: { type: String, required: true },
  interviewerResponse: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('ResumeStrengthSignal', resumeStrengthSignalSchema);
