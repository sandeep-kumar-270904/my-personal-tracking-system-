const mongoose = require('mongoose');

const PredictionFeedbackSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  predictedOutcome: {
    type: String, // 'LIKELY_POSITIVE', 'UNCERTAIN', 'LIKELY_REJECTION'
    required: true
  },
  actualOutcome: {
    type: String, // 'OFFER', 'REJECTED'
    required: true
  },
  wasCorrect: {
    type: Boolean, // thumbs up/down mapped to correctness based on actual vs predicted
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PredictionFeedback', PredictionFeedbackSchema);
