const mongoose = require('mongoose');

const resumeJDScoreSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  jdHash: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    default: 'Unknown Company'
  },
  jobTitle: {
    type: String,
    default: 'Unknown Role'
  },
  dimensions: {
    technicalFit: { type: Number, min: 0, max: 10, default: 0 },
    experienceRelevance: { type: Number, min: 0, max: 10, default: 0 },
    communicationQuality: { type: Number, min: 0, max: 10, default: 0 },
    standoutFactor: { type: Number, min: 0, max: 10, default: 0 },
    redFlags: { type: Number, min: 0, max: 10, default: 0 },
    overallHireLikelihood: { type: Number, min: 0, max: 10, default: 0 }
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  verdict: {
    type: String,
    enum: ['STRONG PASS', 'PASS', 'BORDERLINE', 'REJECT'],
    required: true
  },
  assessment: {
    type: String,
    required: true
  },
  improvementPoints: [{
    type: String
  }]
}, { timestamps: true });

// Ensure one score per resume version and JD hash combo
resumeJDScoreSchema.index({ resumeId: 1, jdHash: 1 }, { unique: true });

module.exports = mongoose.model('ResumeJDScore', resumeJDScoreSchema);
