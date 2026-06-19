const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
  practiceType: { type: String, enum: ['GREETING', 'FIRST_QUESTION_RESPONSE', 'CLARIFICATION_ASKING', 'APPROACH_STRUCTURING'] },
  transcript: { type: String },
  fluencyScore: { type: Number, min: 0, max: 100 },
  hesitationCount: { type: Number },
  timeToFirstWord: { type: Number },
  feedbackText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('OpeningRitualSession', schema);
