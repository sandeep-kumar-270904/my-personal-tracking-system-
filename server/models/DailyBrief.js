const mongoose = require('mongoose');
const dailyBriefSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  dsaTask: { type: String },
  applicationTask: { type: String },
  resumeTask: { type: String },
  generatedAt: { type: Date, default: Date.now },
  wasOpened: { type: Boolean, default: false },
  tasksCompleted: { type: mongoose.Schema.Types.Mixed, default: {} }
});
module.exports = mongoose.model('DailyBrief', dailyBriefSchema);