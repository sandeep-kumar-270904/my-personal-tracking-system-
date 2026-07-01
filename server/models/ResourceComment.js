const mongoose = require('mongoose');

const resourceCommentSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceComment', default: null }, // for replies
  likesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

resourceCommentSchema.index({ resource: 1, createdAt: -1 });
resourceCommentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('ResourceComment', resourceCommentSchema);
