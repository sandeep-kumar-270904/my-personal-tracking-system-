const mongoose = require('mongoose');

const resourceCommentLikeSchema = new mongoose.Schema({
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceComment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

resourceCommentLikeSchema.index({ comment: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ResourceCommentLike', resourceCommentLikeSchema);
