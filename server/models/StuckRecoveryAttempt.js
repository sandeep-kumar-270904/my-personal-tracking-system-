const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
  triggeredAt: { type: Date, default: Date.now },
  studentResponse: { type: String },
  recoveryStrategy: { type: String, enum: ['CLARIFYING_QUESTION', 'BRUTE_FORCE_PROPOSAL', 'THINK_ALOUD', 'ASKED_FOR_NUDGE', 'PIVOTED_APPROACH', 'GAVE_UP'] },
  recoveryScore: { type: Number, min: 0, max: 100 },
  feedbackText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StuckRecoveryAttempt', schema);
