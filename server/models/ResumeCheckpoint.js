const mongoose = require('mongoose');

const resumeCheckpointSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  commitMessage: {
    type: String,
    required: true,
  },
  sectionsSnapshot: {
    type: String, // JSON string of sections array
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeCheckpoint', resumeCheckpointSchema);
