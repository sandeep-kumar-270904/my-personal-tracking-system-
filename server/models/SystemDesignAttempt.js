const mongoose = require('mongoose');

const systemDesignAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
  },
  problemType: { type: String, required: true },
  canvasData: { type: mongoose.Schema.Types.Mixed },
  score: { type: Number },
  feedback: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SystemDesignAttempt', systemDesignAttemptSchema);
