const mongoose = require('mongoose');

const userDriveParticipationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusDrive',
    required: true,
  },
  status: {
    type: String,
    enum: ['Not Eligible', 'Eligible', 'Registered', 'Written Test Cleared', 'GD Cleared', 'Technical Cleared', 'HR Cleared', 'Selected', 'Rejected'],
    default: 'Eligible',
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Prevent multiple participations for same drive
userDriveParticipationSchema.index({ userId: 1, driveId: 1 }, { unique: true });

module.exports = mongoose.model('UserDriveParticipation', userDriveParticipationSchema);
