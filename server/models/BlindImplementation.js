const mongoose = require('mongoose');
const blindImplementationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA', required: true },
  attemptedAt: { type: Date, default: Date.now },
  studentCode: { type: String },
  gotStuck: { type: Boolean },
  stuckPoint: { type: String },
  lookedAnythingUp: { type: Boolean },
  completedAt: { type: Date }
});
module.exports = mongoose.model('BlindImplementation', blindImplementationSchema);