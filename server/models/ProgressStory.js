const mongoose = require('mongoose');
const progressStorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  storyParagraph: { type: String },
  generatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ProgressStory', progressStorySchema);