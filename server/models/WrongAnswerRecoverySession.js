const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  initialWrongAnswer: { type: String },
  challengeReceived: { type: String },
  recoveryResponse: { type: String },
  recoveryStrategy: { type: String, enum: ['ACKNOWLEDGED_AND_PIVOTED', 'DEFENDED_CORRECTLY', 'PARTIAL_CORRECTION', 'SHUT_DOWN'] },
  recoveryScore: { type: Number, min: 0, max: 100 },
  timeToRecovery: { type: Number },
  feedbackText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WrongAnswerRecoverySession', schema);
