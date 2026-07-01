const mongoose = require('mongoose');

const resourceChatLimitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

resourceChatLimitSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ResourceChatLimit', resourceChatLimitSchema);
