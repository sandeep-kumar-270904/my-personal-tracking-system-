const mongoose = require('mongoose');

const behavioralStorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: { type: String, required: true },
  situation: { type: String, required: true },
  task: { type: String, required: true },
  action: { type: String, required: true },
  result: { type: String, required: true },
  themes: [{ type: String }],
  companies: [{ type: String }],
  usedInInterviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  strengthScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BehavioralStory', behavioralStorySchema);
