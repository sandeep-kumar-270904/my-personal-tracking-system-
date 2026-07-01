const mongoose = require('mongoose');
const rubberDuckExplanationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  explanation: { type: String },
  communicationScore: { type: Number, min: 0, max: 100 },
  intuitionExplained: { type: Boolean },
  complexityMentioned: { type: Boolean },
  edgeCasesCovered: { type: Boolean },
  aiFeedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('RubberDuckExplanation', rubberDuckExplanationSchema);