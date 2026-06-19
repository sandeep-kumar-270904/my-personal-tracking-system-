const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetCompany: { type: String },
  roundType: { type: String },
  questionsAsked: [String],
  studentAnswers: [String],
  performanceWithoutValidation: { type: Number, min: 0, max: 100 },
  composureScore: { type: Number, min: 0, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('ColdInterviewerSession', schema);
