const mongoose = require('mongoose');
const studentConceptProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConceptModule', required: true },
  status: { type: String, enum: ['LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED'], default: 'LOCKED' },
  completedAt: { type: Date },
  microProblemAttempts: { type: Number, default: 0 },
  microProblemPassed: { type: Boolean, default: false },
  analogyRating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('StudentConceptProgress', studentConceptProgressSchema);