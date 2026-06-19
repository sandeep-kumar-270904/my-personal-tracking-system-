const mongoose = require('mongoose');
const activeRecallNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  originalNote: { type: String },
  convertedQuestion: { type: String },
  lastTestedAt: { type: Date },
  correctAnswerCount: { type: Number, default: 0 },
  incorrectAnswerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ActiveRecallNote', activeRecallNoteSchema);