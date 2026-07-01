const mongoose = require('mongoose');
const thinkingVelocitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  topic: { type: String },
  pattern: { type: String },
  timeToFirstCorrectApproach: { type: Number },
  wasApproachCorrect: { type: Boolean },
  pressureMode: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ThinkingVelocity', thinkingVelocitySchema);