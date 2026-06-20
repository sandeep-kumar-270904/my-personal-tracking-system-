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
  role: {
    type: String,
    enum: ['student', 'placement_cell_admin'],
    default: 'student'
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
    benchmarkOptOut: { type: Boolean, default: false }, // Legacy
    benchmarkOptIn: { type: Boolean, default: false },
    sustainablePaceOptOut: { type: Boolean, default: false }
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
  },
  googleCalendarSync: {
    connected: { type: Boolean, default: false },
    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    expiryDate: { type: Number, default: 0 },
    syncDirection: { type: String, enum: ['push', 'pull', 'both'], default: 'both' },
    calendarId: { type: String, default: '' },
    googleCalendarId: { type: String, default: 'primary' },
    lastSyncTime: { type: Date }
  },
  calendarSettings: {
    timezone: { type: String, default: '' },
    preferredView: { type: String, default: 'month' },
    disablePrepSuggestions: { type: Boolean, default: false },
    shareToken: { type: String, default: null }, // Legacy
    shareInterviewsOnly: { type: Boolean, default: false }, // Legacy
    shareLinks: [{
      token: String,
      name: String,
      mode: { type: String, enum: ['full', 'summary'], default: 'full' },
      createdAt: { type: Date, default: Date.now }
    }],
    recruiterLinks: [{
      token: String,
      startDate: Date,
      endDate: Date,
      duration: Number,
      createdAt: { type: Date, default: Date.now }
    }],
    dailyDigestEnabled: { type: Boolean, default: false },
    dailyDigestTime: { type: String, default: '08:00' },
    suppressIndividualReminders: { type: Boolean, default: false }
  },
  benchmarkOptIn: {
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
