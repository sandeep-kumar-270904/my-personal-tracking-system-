const mongoose = require('mongoose');

const weeklyBenchmarkSchema = new mongoose.Schema({
  weekOf: {
    type: Date,
    required: true,
    unique: true
  },
  avgContactsAtOffer: {
    type: Number,
    default: 0
  },
  percentageStartedZero: {
    type: Number,
    default: 0
  },
  avgDaysFirstContactToReferral: {
    type: Number,
    default: 0
  },
  avgResponseRate: {
    type: Number,
    default: 0
  },
  medianOutreachToInterview: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyBenchmark', weeklyBenchmarkSchema);
