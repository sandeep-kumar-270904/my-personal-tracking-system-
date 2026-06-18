const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  changeNote: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);
