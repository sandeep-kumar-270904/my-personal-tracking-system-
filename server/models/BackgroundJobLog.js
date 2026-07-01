const mongoose = require('mongoose');

const backgroundJobLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobName: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  stepsCompleted: [{ type: String }],
  errors: [{ step: String, message: String }],
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('BackgroundJobLog', backgroundJobLogSchema);
