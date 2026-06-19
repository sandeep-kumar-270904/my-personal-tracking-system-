const mongoose = require('mongoose');
const diagnosticAssessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: { type: Date, default: Date.now },
  responses: [mongoose.Schema.Types.Mixed],
  startingTopic: { type: String },
  startingPattern: { type: String },
  estimatedLevel: { type: String, enum: ['ABSOLUTE_BEGINNER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
  fullRoadmapRevealedAt: { type: Date },
  revealedWeeks: { type: Number, default: 0 }
});
module.exports = mongoose.model('DiagnosticAssessment', diagnosticAssessmentSchema);