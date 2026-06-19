const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
  capturedAt: { type: Date, default: Date.now },
  responses: { type: mongoose.Schema.Types.Mixed }, // JSON for 5 questions
  qualityScore: { type: Number, min: 0, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('MemoryCaptureResponse', schema);
