const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  signOnBonus: {
    type: Number,
    default: 0
  },
  rsu: {
    type: Number,
    default: 0
  },
  totalCTC: {
    type: Number,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Negotiating', 'Accepted', 'Declined'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Auto calculate CTC before saving
offerSchema.pre('validate', function(next) {
  this.totalCTC = (this.baseSalary || 0) + (this.signOnBonus || 0) + (this.rsu || 0);
  next();
});

module.exports = mongoose.model('Offer', offerSchema);
