const mongoose = require('mongoose');
const stuckProtocolLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  triggeredAt: { type: Date, default: Date.now },
  choiceMade: { type: String, enum: ['HINT', 'APPROACH_CHECK', 'MOVE_ON'] },
  hintShown: { type: String },
  approachDescription: { type: String },
  approachFeedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('StuckProtocolLog', stuckProtocolLogSchema);