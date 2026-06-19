const mongoose = require('mongoose');

const dsaSkillSyncLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  skillAdded: {
    type: String,
    required: true,
  },
  proficiencyLevel: {
    type: String, // 'proficient', 'strong', 'familiar'
    required: true,
  },
  problemCountAtSync: {
    type: Number,
    required: true,
  },
  wasAccepted: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('DSASkillSyncLog', dsaSkillSyncLogSchema);
