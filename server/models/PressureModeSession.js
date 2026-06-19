const mongoose = require('mongoose');
const pressureModeSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  startedAt: { type: Date, default: Date.now },
  timeLimitSeconds: { type: Number },
  completedAt: { type: Date },
  timeRemainingOnSubmit: { type: Number },
  simulatedInterviewerPrompts: [mongoose.Schema.Types.Mixed],
  lookedUpAnything: { type: Boolean },
  pressureScore: { type: Number, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PressureModeSession', pressureModeSessionSchema);