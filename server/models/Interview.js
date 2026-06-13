const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  company: {
    type: String,
    required: true,
  },
  interviewDate: {
    type: Date,
    required: true,
  },
  round: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Preparing', 'Done', 'Cancelled'],
    default: 'Scheduled',
  },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
