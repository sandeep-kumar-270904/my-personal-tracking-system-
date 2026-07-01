const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "first_step", "week_warrior"
  name: { type: String, required: true },
  description: { type: String, required: true },
  emoji: { type: String, required: true },
  category: { type: String, enum: ['completion', 'streak', 'contribution', 'discovery'], required: true }
});

module.exports = mongoose.model('Badge', badgeSchema);
