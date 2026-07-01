const mongoose = require('mongoose');

const studentFollowSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

studentFollowSchema.index({ follower: 1, following: 1 }, { unique: true });
studentFollowSchema.index({ following: 1 });

module.exports = mongoose.model('StudentFollow', studentFollowSchema);
