const mongoose = require('mongoose');

const interviewerProfileSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
  },
  name: { type: String, required: true },
  company: { type: String, required: true },
  role: { type: String },
  linkedinUrl: { type: String },
  typicalQuestionFocus: [{ type: String }],
  seniorityLevel: {
    type: String,
    enum: ['JUNIOR', 'MID', 'SENIOR', 'STAFF', 'MANAGER', 'DIRECTOR', 'VP']
  },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InterviewerProfile', interviewerProfileSchema);
