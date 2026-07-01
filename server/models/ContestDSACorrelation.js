const mongoose = require('mongoose');

const contestDSACorrelationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest', // Assuming a Contest model exists
    required: true
  },
  problemsSolvedInContest: {
    type: Number,
    default: 0
  },
  topicsTestedInContest: {
    type: [String],
    default: []
  },
  patternsTestedInContest: {
    type: [String],
    default: []
  },
  userMasteryAtContestTime: {
    type: Object, // Snapshot of user's mastery
    default: {}
  },
  performanceScore: {
    type: Number, // 0-100
    default: 0
  },
  masteryPredictionAccuracy: {
    type: Number, // 0-100
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('ContestDSACorrelation', contestDSACorrelationSchema);
