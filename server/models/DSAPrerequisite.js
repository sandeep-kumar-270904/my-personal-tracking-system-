const mongoose = require('mongoose');

const dsaPrerequisiteSchema = new mongoose.Schema({
  topicOrPattern: {
    type: String,
    required: true,
  },
  prerequisiteTopicOrPattern: {
    type: String,
    required: true,
  },
  importance: {
    type: String,
    enum: ['REQUIRED', 'HELPFUL'],
    default: 'REQUIRED'
  }
}, { timestamps: true });

module.exports = mongoose.model('DSAPrerequisite', dsaPrerequisiteSchema);
