const mongoose = require('mongoose');
const conceptModuleSchema = new mongoose.Schema({
  topicOrPattern: { type: String, required: true },
  title: { type: String, required: true },
  realWorldAnalogy: { type: String, required: true },
  coreInsight: { type: String, required: true },
  minimalExample: { type: String, required: true },
  template: { type: String, required: true },
  microProblemQuestion: { type: String, required: true },
  microProblemAnswer: { type: String, required: true },
  orderIndex: { type: Number, required: true },
  prerequisites: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ConceptModule', conceptModuleSchema);