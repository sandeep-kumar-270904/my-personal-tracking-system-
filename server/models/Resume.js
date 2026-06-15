const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  versionTag: {
    type: String,
    default: 'v1',
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Middleware to ensure only one primary resume per user
resumeSchema.pre('save', async function (next) {
  if (this.isModified('isPrimary') && this.isPrimary) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isPrimary: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
