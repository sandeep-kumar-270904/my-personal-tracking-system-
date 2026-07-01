const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'BehavioralStory' },
  deliveryMethod: { type: String, enum: ['TYPED', 'SPOKEN'] },
  transcript: { type: String },
  naturalnesScore: { type: Number, min: 0, max: 100 },
  roboticPhrases: [String],
  genuineMoments: [String],
  paceScore: { type: Number, min: 0, max: 100 },
  feedbackText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StoryNaturalnessScore', schema);
