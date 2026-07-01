const mongoose = require('mongoose');

const offerCriteriaSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  criteria_name: {
    type: String,
    required: true
  },
  criteria_type: {
    type: String,
    enum: ['min_value', 'max_value', 'preferred_match', 'dealbreaker'],
    required: true
  },
  target_value: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('OfferCriteria', offerCriteriaSchema);
