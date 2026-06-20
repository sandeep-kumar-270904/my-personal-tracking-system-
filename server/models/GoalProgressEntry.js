const mongoose = require('mongoose');

const goalProgressEntrySchema = new mongoose.Schema({
  goal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 1
  },
  source: {
    type: String,
    enum: ['auto', 'manual_adjustment'],
    required: true
  },
  source_ref_id: {
    type: String,
    default: null
  },
  logged_at: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GoalProgressEntry', goalProgressEntrySchema);
