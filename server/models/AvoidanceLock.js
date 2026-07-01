const mongoose = require('mongoose');
const avoidanceLockSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lockedTopic: { type: String },
  lockedAt: { type: Date, default: Date.now },
  unlockedAt: { type: Date },
  requiredProblems: { type: Number },
  completedProblems: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});
module.exports = mongoose.model('AvoidanceLock', avoidanceLockSchema);