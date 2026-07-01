const mongoose = require('mongoose');

const resourceSubmissionSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true, maxlength: 60 },
  url: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['DSA', 'Web Dev', 'System Design', 'CS Core', 'Interview Prep']
  },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  description: { type: String, required: true, maxlength: 200 },
  whyRecommend: { type: String, required: true, maxlength: 300 },
  timeToComplete: { 
    type: String, 
    required: true,
    enum: ['< 1 week', '1–2 weeks', '1 month', 'Ongoing']
  },
  levelWhenHelped: { 
    type: String, 
    required: true,
    enum: ['Just starting out', 'Mid prep', 'Final round prep']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: { type: String },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ResourceSubmission', resourceSubmissionSchema);
