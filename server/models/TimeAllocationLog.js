const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  allocatedApproachMinutes: { type: Number },
  allocatedCodingMinutes: { type: Number },
  allocatedTestingMinutes: { type: Number },
  actualApproachMinutes: { type: Number },
  actualCodingMinutes: { type: Number },
  actualTestingMinutes: { type: Number },
  phaseAccuracy: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('TimeAllocationLog', schema);
