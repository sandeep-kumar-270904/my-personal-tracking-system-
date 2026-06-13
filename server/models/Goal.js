const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  targetApplications: {
    type: Number,
    default: 10
  },
  targetDSA: {
    type: Number,
    default: 5
  },
  targetNetworking: {
    type: Number,
    default: 3
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
