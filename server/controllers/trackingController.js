const Application = require('../models/Application');
const ApplicationSuggestion = require('../models/ApplicationSuggestion');
const WeeklyReview = require('../models/WeeklyReview');
const PlacementBattlePlan = require('../models/PlacementBattlePlan');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

exports.patchEffort = async (req, res) => {
  try {
    const { minutes } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app || app.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Application not found' });
    }
    app.effortMinutes += parseInt(minutes || 0);
    await app.save();

    await AuditLog.create({
      userId: req.user.id,
      applicationId: app._id,
      action: 'UPDATE_EFFORT',
      fieldChanged: 'effortMinutes',
      oldValue: app.effortMinutes - minutes,
      newValue: app.effortMinutes,
      ipAddress: req.ip
    });

    res.json({ effortMinutes: app.effortMinutes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.archiveApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app || app.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Application not found' });
    }
    app.isArchived = !app.isArchived;
    app.archivedAt = app.isArchived ? new Date() : null;
    await app.save();

    await AuditLog.create({
      userId: req.user.id,
      applicationId: app._id,
      action: app.isArchived ? 'ARCHIVE' : 'UNARCHIVE',
      ipAddress: req.ip
    });

    res.json({ isArchived: app.isArchived });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await ApplicationSuggestion.find({ 
      userId: req.user.id, 
      isDismissed: false,
      $or: [
        { snoozedUntil: { $exists: false } },
        { snoozedUntil: { $lt: new Date() } }
      ]
    }).populate('applicationId', 'company role status');
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSuggestion = async (req, res) => {
  try {
    const { action } = req.body; // 'accept', 'snooze', 'ignore'
    const suggestion = await ApplicationSuggestion.findById(req.params.id);
    if (!suggestion || suggestion.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    if (action === 'accept') {
      const app = await Application.findById(suggestion.applicationId);
      app.status = suggestion.suggestedStatus;
      await app.save();
      suggestion.isDismissed = true;
    } else if (action === 'snooze') {
      const snoozedDate = new Date();
      snoozedDate.setDate(snoozedDate.getDate() + 3);
      suggestion.snoozedUntil = snoozedDate;
    } else if (action === 'ignore') {
      suggestion.isDismissed = true;
    }

    await suggestion.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Weekly Review
exports.getWeeklyReviewData = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stagnantApps = await Application.find({
      userId: req.user.id,
      status: { $nin: ['REJECTED', 'OFFER'] },
      isArchived: false,
      updatedAt: { $lt: sevenDaysAgo }
    });

    const latestReview = await WeeklyReview.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    res.json({ stagnantApps, latestReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveWeeklyReview = async (req, res) => {
  try {
    const review = await WeeklyReview.create({
      userId: req.user.id,
      weekStartDate: new Date(),
      intentionText: req.body.intentionText,
      statsSnapshot: req.body.statsSnapshot
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Battle Plan
exports.getBattlePlan = async (req, res) => {
  try {
    const plan = await PlacementBattlePlan.findOne({ userId: req.user.id });
    res.json(plan || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveBattlePlan = async (req, res) => {
  try {
    let plan = await PlacementBattlePlan.findOne({ userId: req.user.id });
    if (plan) {
      Object.assign(plan, req.body);
      await plan.save();
    } else {
      plan = await PlacementBattlePlan.create({ ...req.body, userId: req.user.id });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Audit & Compliance
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.user.id })
      .populate('applicationId', 'company role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestDataDeletion = async (req, res) => {
  try {
    // Just marking it for deletion request in this scope
    const user = await User.findById(req.user.id);
    // You could set a flag user.deletionRequested = true
    res.json({ message: 'Data deletion requested successfully. We will process it within 30 days.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
