const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  questionCategory: { type: String, enum: ['TECHNICAL_CULTURE', 'GROWTH_OPPORTUNITY', 'TEAM_DYNAMICS', 'PRODUCT_DIRECTION', 'ENGINEERING_PRACTICES', 'ROLE_EXPECTATIONS', 'COMPANY_VISION'] },
  interviewerType: { type: String, enum: ['ENGINEER', 'MANAGER', 'HR', 'FOUNDER', 'SENIOR_IC'] },
  timesUsed: { type: Number, default: 0 },
  positiveReactionCount: { type: Number, default: 0 },
  isStarred: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('InterviewQuestionBank', schema);
