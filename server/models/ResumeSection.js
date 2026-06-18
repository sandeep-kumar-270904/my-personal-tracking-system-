const mongoose = require('mongoose');

const resumeSectionSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  sectionType: {
    type: String,
    enum: ['EDUCATION', 'EXPERIENCE', 'PROJECTS', 'SKILLS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'SUMMARY', 'CUSTOM'],
    required: true,
  },
  content: {
    type: String,
  },
  orderIndex: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('ResumeSection', resumeSectionSchema);
