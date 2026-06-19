const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  signal: { type: String, required: true },
  signalMeaning: { type: String, required: true },
  appropriateResponse: { type: String, required: true },
  category: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'PROBE', 'REDIRECT', 'WRAP_UP'] },
  confidenceLevel: { type: Number, min: 0, max: 100, default: 90 }
}, { timestamps: true });

module.exports = mongoose.model('InterviewSignalVocabulary', schema);
