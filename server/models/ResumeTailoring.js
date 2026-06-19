const mongoose = require('mongoose');

const resumeTailoringSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resume'
  },
  targetRole: {
    type: String,
    required: true
  },
  targetCompany: {
    type: String,
    required: true
  },
  tailoringPlan: {
    type: Object, // Stores JSON of the plan (sectionsToEmphasize, keywordsToAdd, etc.)
    required: true
  },
  appliedAt: {
    type: Date
  },
  scoreBeforeAndAfter: {
    type: Object // { before: 75, after: 88 }
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeTailoring', resumeTailoringSchema);
