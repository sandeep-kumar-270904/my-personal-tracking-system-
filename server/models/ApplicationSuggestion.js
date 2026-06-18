const mongoose = require('mongoose');

const ApplicationSuggestionSchema = new mongoose.Schema({
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
  suggestionType: {
    type: String, // e.g., 'STATUS_UPDATE', 'FOLLOW_UP', 'DEBRIEF'
    required: true
  },
  suggestedStatus: {
    type: String
  },
  reason: {
    type: String,
    required: true
  },
  isDismissed: {
    type: Boolean,
    default: false
  },
  snoozedUntil: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ApplicationSuggestion', ApplicationSuggestionSchema);
