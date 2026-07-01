const mongoose = require('mongoose');

const studentStreakSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('StudentStreak', studentStreakSchema);
