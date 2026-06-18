const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  atsScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  wordCount: Number,
  skillsDetected: [String],
  missingCommonSkills: [String],
  experienceYears: Number,
  educationDetected: mongoose.Schema.Types.Mixed,
  formattingIssues: [String],
  keywordsFound: [String],
  suggestions: [String],
}, { timestamps: true });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
