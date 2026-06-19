const mongoose = require('mongoose');

const resumeOutcomeLearningSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  status: {
    type: String,
    required: true
  },
  insight: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    enum: ['REINFORCE', 'FIX']
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeOutcomeLearning', resumeOutcomeLearningSchema);
