const mongoose = require('mongoose');
const orcaFrameworkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSA' },
  observe: { type: String },
  recognize: { type: String },
  consider: { type: String },
  attack: { type: String },
  submittedAt: { type: Date, default: Date.now },
  wasHelpful: { type: Boolean }
});
module.exports = mongoose.model('ORCAFramework', orcaFrameworkSchema);