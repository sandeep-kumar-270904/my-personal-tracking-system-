const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goal: {
    type: String,
    required: true
  },
  timelineWeeks: {
    type: Number,
    required: true
  },
  hoursPerDay: {
    type: Number,
    required: true
  },
  preferences: [{
    type: String
  }],
  plan: [{
    week: Number,
    focus: String,
    tasks: [{
      title: String,
      description: String,
      completed: { type: Boolean, default: false }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
