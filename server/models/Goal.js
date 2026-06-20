const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: null
  },
  is_default: {
    type: Boolean,
    default: false
  },
  target_value: {
    type: Number,
    required: true,
    min: 1
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'weekly'
  },
  tracking_mode: {
    type: String,
    enum: ['auto', 'manual', 'hybrid'],
    default: 'hybrid'
  },
  linked_module: {
    type: String,
    enum: ['applications', 'dsa_tracker', 'networking', null],
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  },
  pinned: {
    type: Boolean,
    default: false
  },
  estimated_time_minutes: {
    type: Number,
    default: function() {
      if (this.linked_module === 'dsa_tracker') return 45;
      if (this.linked_module === 'applications') return 20;
      if (this.linked_module === 'networking') return 30;
      return 30; // default for custom
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Goal', goalSchema);
