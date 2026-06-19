const mongoose = require('mongoose');
const solutionQualityEvalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  solutionCode: { type: String },
  correctnessScore: { type: Number, min: 0, max: 100 },
  efficiencyScore: { type: Number, min: 0, max: 100 },
  readabilityScore: { type: Number, min: 0, max: 100 },
  interviewabilityScore: { type: Number, min: 0, max: 100 },
  overallScore: { type: Number, min: 0, max: 100 },
  specificImprovements: [{ type: String }],
  optimalSolutionExists: { type: Boolean },
  optimalApproach: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('SolutionQualityEval', solutionQualityEvalSchema);