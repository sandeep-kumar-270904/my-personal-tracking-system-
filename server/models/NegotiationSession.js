const mongoose = require('mongoose');

const NegotiationSessionSchema = new mongoose.Schema({
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
  offeredCTC: {
    base: Number,
    variable: Number,
    equity: Number
  },
  targetCTC: {
    type: Number,
    required: true
  },
  strategy: {
    type: mongoose.Schema.Types.Mixed, // JSON strategy details
    default: {}
  },
  chatHistory: {
    type: [mongoose.Schema.Types.Mixed], // array of message objects { role, content }
    default: []
  },
  outcome: {
    type: String // 'SUCCESS', 'FAILED', 'PENDING'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NegotiationSession', NegotiationSessionSchema);
