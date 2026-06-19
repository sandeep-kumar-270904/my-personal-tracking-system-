const mongoose = require('mongoose');

const offerPredictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
  confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
  signals: [{ type: String }],
  predictedAt: { type: Date, default: Date.now },
  wasCorrect: { type: Boolean, default: null }, // filled when offer is received or not
}, { timestamps: true });

module.exports = mongoose.model('OfferPrediction', offerPredictionSchema);
