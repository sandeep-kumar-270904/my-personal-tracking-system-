const mongoose = require('mongoose');

const resourceBookmarkSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  savedAt: { type: Date, default: Date.now }
});

resourceBookmarkSchema.index({ resourceId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ResourceBookmark', resourceBookmarkSchema);
