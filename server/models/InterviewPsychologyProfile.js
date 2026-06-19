const mongoose = require('mongoose');

const interviewPsychologyProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  warmUpPattern: {
    type: String,
    enum: ['SLOW_STARTER', 'FAST_STARTER', 'CONSISTENT'],
    default: 'CONSISTENT'
  },
  endurancePattern: {
    type: String,
    enum: ['FADES', 'MAINTAINS', 'FINISHES_STRONG'],
    default: 'MAINTAINS'
  },
  interviewerResponsePattern: {
    type: String,
    enum: ['PERFORMS_BETTER_WITH_ENCOURAGING', 'PERFORMS_BETTER_WITH_TOUGH', 'INTERVIEWER_NEUTRAL'],
    default: 'INTERVIEWER_NEUTRAL'
  },
  pressureResponse: {
    type: String,
    enum: ['FREEZES', 'PERFORMS_UNDER_PRESSURE', 'PRESSURE_NEUTRAL'],
    default: 'PRESSURE_NEUTRAL'
  },
  recoveryPattern: {
    type: String,
    enum: ['RECOVERS_WELL', 'STRUGGLES_TO_RECOVER', 'RARELY_NEEDS_RECOVERY'],
    default: 'RECOVERS_WELL'
  },
  optimalDuration: {
    type: Number,
    default: 45 // minutes
  },
  profileConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tacticalRecommendations: {
    warmUp: String,
    endurance: String,
    interviewer: String,
    pressure: String,
    recovery: String
  },
  history: [{
    date: { type: Date, default: Date.now },
    warmUpPattern: String,
    endurancePattern: String,
    interviewerResponsePattern: String,
    pressureResponse: String,
    recoveryPattern: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('InterviewPsychologyProfile', interviewPsychologyProfileSchema);
