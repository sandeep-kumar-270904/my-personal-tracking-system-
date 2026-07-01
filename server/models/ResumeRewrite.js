const mongoose = require('mongoose');

const resumeRewriteSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resume'
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ResumeSection'
  },
  rewriteType: {
    type: String,
    enum: ['IMPROVE', 'QUANTIFY', 'SHORTEN'],
    required: true
  },
  originalContent: {
    type: String,
    required: true
  },
  rewrittenContent: {
    type: String,
    required: true
  },
  wasAccepted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeRewrite', resumeRewriteSchema);
