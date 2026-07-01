const mongoose = require('mongoose');

const applicationTimelineSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Application'
  },
  event: {
    type: String,
    required: true
  },
  previousStatus: {
    type: String
  },
  newStatus: {
    type: String
  },
  note: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ApplicationTimeline', applicationTimelineSchema);
