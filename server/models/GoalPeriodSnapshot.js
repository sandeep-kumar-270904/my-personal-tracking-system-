const mongoose = require('mongoose');

const goalPeriodSnapshotSchema = new mongoose.Schema({
  goal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  period_start: {
    type: Date,
    required: true
  },
  period_end: {
    type: Date,
    required: true
  },
  target_value_at_period: {
    type: Number,
    required: true
  },
  final_completed_value: {
    type: Number,
    required: true
  },
  subjective_feedback: {
    type: String,
    enum: ['too_easy', 'just_right', 'too_much', null],
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GoalPeriodSnapshot', goalPeriodSnapshotSchema);
