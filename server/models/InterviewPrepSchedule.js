const mongoose = require('mongoose');

const interviewPrepScheduleSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Interview',
  },
  dayNumber: { type: Number, required: true },
  date: { type: Date, required: true },
  tasks: [{ type: mongoose.Schema.Types.Mixed }] // Array of { taskType, description, estimatedMinutes, isCompleted, completedAt }
}, { timestamps: true });

module.exports = mongoose.model('InterviewPrepSchedule', interviewPrepScheduleSchema);
