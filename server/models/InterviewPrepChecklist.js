const mongoose = require('mongoose');

const interviewPrepChecklistSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Interview',
  },
  checklistType: {
    type: String,
    enum: ['COMPANY_RESEARCH', 'DSA_TOPICS', 'BEHAVIORAL_STORIES', 'SYSTEM_DESIGN', 'RESUME_REVIEW', 'MOCK_PRACTICE', 'GOOD_SLEEP', 'LOGISTICS'],
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewPrepChecklist', interviewPrepChecklistSchema);
