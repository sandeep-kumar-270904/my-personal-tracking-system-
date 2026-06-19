const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  targetCompany: { type: String },
  transcript: { type: String },
  silenceGaps: [{ startSecond: Number, endSecond: Number, durationSeconds: Number }],
  longestSilence: { type: Number },
  avgSilenceGap: { type: Number },
  narrationQuality: { type: Number, min: 0, max: 100 },
  codingAccuracy: { type: Number, min: 0, max: 100 },
  feedbackText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TalkWhileCodingSession', schema);
