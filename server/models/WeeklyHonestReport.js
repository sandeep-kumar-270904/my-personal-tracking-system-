const mongoose = require('mongoose');
const weeklyHonestReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  sentence1: { type: String },
  sentence2: { type: String },
  sentence3: { type: String },
  generatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('WeeklyHonestReport', weeklyHonestReportSchema);