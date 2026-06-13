const mongoose = require('mongoose');

const networkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Contact name is required']
  },
  company: {
    type: String,
    required: [true, 'Company is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required']
  },
  platform: {
    type: String,
    enum: ['LinkedIn', 'Email', 'Twitter', 'Other'],
    default: 'LinkedIn'
  },
  status: {
    type: String,
    enum: ['To Contact', 'Reached Out', 'Replied', 'Referral Given', 'Rejected'],
    default: 'To Contact'
  },
  lastContactDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Network', networkSchema);
