const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  endpoint: {
    type: String,
    required: true,
    unique: true,
  },
  keys: {
    p256dh: String,
    auth: String
  }
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
