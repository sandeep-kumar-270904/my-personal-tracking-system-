const mongoose = require('mongoose');

const applicationTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  defaultStatus: {
    type: String,
    default: 'APPLIED'
  },
  defaultSource: {
    type: String,
    default: 'ONLINE'
  },
  defaultPriority: {
    type: String,
    default: 'MEDIUM'
  },
  defaultNotes: {
    type: String,
    default: ''
  },
  defaultTags: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('ApplicationTemplate', applicationTemplateSchema);
