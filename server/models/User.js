const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  college: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: ''
  },
  gradYear: {
    type: String,
    default: ''
  },
  targetCompanies: {
    type: [String],
    default: []
  },
  placementSeasonStart: {
    type: String,
    default: ''
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  isOnboarded: {
    type: Boolean,
    default: false
  },
  aiInsightsCache: {
    text: String,
    generatedAt: Date
  },
  notificationPreferences: {
    weeklyEmail: {
      type: Boolean,
      default: true
    }
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  leetcodeUsername: {
    type: String,
    default: ''
  },
  gfgUsername: {
    type: String,
    default: ''
  },
  isPublicProfile: {
    type: Boolean,
    default: false
  },
  publicProfileSettings: {
    showApplicationsCount: { type: Boolean, default: true },
    showDSAStats: { type: Boolean, default: true },
    showStreak: { type: Boolean, default: true },
    showTargetCompanies: { type: Boolean, default: true },
    isOpenToOpportunities: { type: Boolean, default: true },
    benchmarkOptOut: { type: Boolean, default: false }
  },
  cgpa: {
    type: Number,
    default: 0
  },
  activeBacklogs: {
    type: Number,
    default: 0
  },
  newProblemLock: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Generate email verification token
userSchema.methods.getVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  return verificationToken;
};

module.exports = mongoose.model('User', userSchema);
