const mongoose = require('mongoose');

const companyProcessSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  totalRounds: {
    type: Number,
    default: 1
  },
  roundSequence: [{
    roundType: String,
    typicalDuration: Number // minutes
  }],
  typicalTimeline: {
    type: Number, // days from first round to offer
    default: 14
  },
  onlineAssessmentPlatform: {
    type: String,
    default: 'Unknown'
  },
  hasGroupDiscussion: {
    type: Boolean,
    default: false
  },
  hasAptitudeTest: {
    type: Boolean,
    default: false
  },
  typicalCTCFresher: {
    type: Number
  },
  dataPoints: {
    type: Number,
    default: 1 // how many users contributed
  }
}, { timestamps: true });

module.exports = mongoose.model('CompanyProcess', companyProcessSchema);
