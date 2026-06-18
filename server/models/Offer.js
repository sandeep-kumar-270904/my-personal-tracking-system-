const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  baseCTC: {
    type: Number,
    required: true
  },
  variableCTC: {
    type: Number,
    default: 0
  },
  equity: {
    type: Number,
    default: 0
  },
  joiningDate: {
    type: Date
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['CONSIDERING', 'ACCEPTED', 'DECLINED', 'NEGOTIATING'],
    default: 'CONSIDERING'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
