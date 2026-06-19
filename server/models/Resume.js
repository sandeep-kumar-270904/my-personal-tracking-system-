const mongoose = require('mongoose');
const timelinePlugin = require('../utils/timelinePlugin');

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
  name: {
    type: String,
  },
  tags: [{
    type: String
  }],
  version: {
    type: Number,
    default: 1
  },
  parentResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  isActive: {
    type: Boolean,
    default: true
  },
  importSource: {
    type: String,
    enum: ['MANUAL_UPLOAD', 'LINKEDIN_IMPORT', 'AI_GENERATED'],
    default: 'MANUAL_UPLOAD'
  },
  pageCount: {
    type: Number
  },
  notes: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Middleware to ensure only one primary resume per user
resumeSchema.pre('save', async function () {
  if (this.isModified('isPrimary') && this.isPrimary) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isPrimary: false } }
    );
  }
});

resumeSchema.plugin(timelinePlugin);

module.exports = mongoose.model('Resume', resumeSchema);
