const mongoose = require('mongoose');

const networkingGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  outreachTarget: { type: Number, default: 0 },
  outreachCompleted: { type: Number, default: 0 },
  responsesTarget: { type: Number, default: 0 },
  responsesReceived: { type: Number, default: 0 },
  referralsTarget: { type: Number, default: 0 },
  referralsReceived: { type: Number, default: 0 },
  newContactsTarget: { type: Number, default: 0 },
  newContactsAdded: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('NetworkingGoal', networkingGoalSchema);
