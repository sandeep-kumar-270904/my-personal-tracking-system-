const mongoose = require('mongoose');

const anonymousInterviewerQuestionSchema = new mongoose.Schema({
  company: { type: String, required: true },
  interviewerNameHash: { type: String, required: true },
  questions: [{ type: String }]
}, { timestamps: true });

// Prevent duplicate hashes for same company
anonymousInterviewerQuestionSchema.index({ company: 1, interviewerNameHash: 1 }, { unique: true });

module.exports = mongoose.model('AnonymousInterviewerQuestion', anonymousInterviewerQuestionSchema);
