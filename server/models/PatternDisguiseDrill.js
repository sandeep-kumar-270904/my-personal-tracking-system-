const mongoose = require('mongoose');
const patternDisguiseDrillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  studentGuessedPattern: { type: String },
  correctPattern: { type: String },
  wasCorrect: { type: Boolean },
  timeToIdentify: { type: Number },
  attemptedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PatternDisguiseDrill', patternDisguiseDrillSchema);