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

const ResumeCheckpoint = require('./ResumeCheckpoint');

// Middleware to create checkpoint
async function createCheckpoint(doc) {
  if (!doc) return;
  try {
    // We need all sections to form a complete snapshot
    const sections = await mongoose.model('ResumeSection').find({ resumeId: doc.resumeId }).sort('orderIndex');
    
    // Only create a checkpoint if we have sections (to avoid saving empty states on initial creation before all sections exist)
    if (sections.length > 0) {
      await ResumeCheckpoint.create({
        resumeId: doc.resumeId,
        commitMessage: `Updated ${doc.sectionType} section`,
        sectionsSnapshot: JSON.stringify(sections)
      });
    }
  } catch (error) {
    console.error('Error creating checkpoint in middleware:', error);
  }
}

resumeSectionSchema.post('save', function(doc, next) {
  createCheckpoint(doc);
  next();
});

resumeSectionSchema.post('findOneAndUpdate', function(doc, next) {
  createCheckpoint(doc);
  next();
});

resumeSectionSchema.post('findOneAndReplace', function(doc, next) {
  createCheckpoint(doc);
  next();
});

module.exports = mongoose.model('ResumeSection', resumeSectionSchema);
