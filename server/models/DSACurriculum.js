const mongoose = require('mongoose');

const dsaCurriculumSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetCompanies: {
    type: [String],
    default: []
  },
  weeklyPlan: {
    type: Array, // Structured JSON array of weeks
    default: []
  },
  currentWeek: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DSACurriculum', dsaCurriculumSchema);
