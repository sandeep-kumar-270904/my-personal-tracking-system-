const mongoose = require('mongoose');

const campusDriveSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  visitDate: {
    type: Date,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  eligibility: {
    minCGPA: {
      type: Number,
      default: 0
    },
    allowedBranches: {
      type: [String],
      default: []
    },
    maxActiveBacklogs: {
      type: Number,
      default: 0
    },
    allowedGradYears: {
      type: [String],
      default: []
    }
  },
  roundsSchedule: {
    writtenTestDate: Date,
    gdDate: Date,
    technicalInterviewDate: Date,
    hrInterviewDate: Date
  },
  description: {
    type: String,
    default: ''
  },
  rolesOffered: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('CampusDrive', campusDriveSchema);
