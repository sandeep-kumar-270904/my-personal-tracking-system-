const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  protocolSteps: [{
    time: String,
    action: String,
    evidence: String,
    isCompleted: { type: Boolean, default: false }
  }],
  lastUsedAt: { type: Date },
  averagePerformanceWhenFollowed: { type: Number },
  averagePerformanceWhenNotFollowed: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('PreInterviewProtocol', schema);
