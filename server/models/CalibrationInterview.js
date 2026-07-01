const mongoose = require('mongoose');
const calibrationInterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attemptedAt: { type: Date, default: Date.now },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DSA' }],
  scores: [mongoose.Schema.Types.Mixed],
  actualLevel: { type: String },
  selfAssessedLevel: { type: String },
  biggestGap: { type: String },
  weakestUnexpectedArea: { type: String },
  percentileEstimate: { type: Number },
  completedAt: { type: Date }
});
module.exports = mongoose.model('CalibrationInterview', calibrationInterviewSchema);