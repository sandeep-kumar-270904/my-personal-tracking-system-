const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionAsked: { type: String },
  initialAnswer: { type: String },
  followUpQuestion: { type: String },
  followUpAnswer: { type: String },
  depthScore: { type: Number, min: 0, max: 100 },
  reasoningClarity: { type: Number, min: 0, max: 100 },
  tradeoffMentioned: { type: Boolean },
  feedbackText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FollowUpDepthSession', schema);
