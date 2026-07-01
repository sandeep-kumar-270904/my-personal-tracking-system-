const mongoose = require('mongoose');

const placementDriveBroadcastSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    default: []
  },
  eligibleBranches: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ''
  },
  deadline: {
    type: Date,
    required: true
  },
  applyLink: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlacementDriveBroadcast', placementDriveBroadcastSchema);
