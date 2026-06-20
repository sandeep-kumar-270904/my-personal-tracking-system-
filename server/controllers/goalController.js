const Goal = require('../models/Goal');
const GoalProgressEntry = require('../models/GoalProgressEntry');
const GoalPeriodSnapshot = require('../models/GoalPeriodSnapshot');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Offer = require('../models/Offer');
const Event = require('../models/Event');
const SharedView = require('../models/SharedView');
const crypto = require('crypto');

const getPeriodBounds = (periodStr) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (periodStr === 'weekly') {
    start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)); // Monday
    end.setDate(start.getDate() + 6); // Sunday
  } else {
    start.setDate(1); // 1st of month
    end.setMonth(end.getMonth() + 1, 0); // Last day of month
  }
  return { start, end };
};

// @desc    Get user goals and current progress
// @route   GET /api/goals
exports.getGoalsOverview = async (req, res) => {
  try {
    let goals = await Goal.find({ user_id: req.user.id, status: { $in: ['active', 'paused'] } });

    // Initialize default goals if user has none (even archived)
    if (goals.length === 0) {
      const anyArchived = await Goal.findOne({ user_id: req.user.id });
      if (!anyArchived) {
        goals = await Goal.insertMany([
          { user_id: req.user.id, title: 'Job Applications', icon: 'briefcase', is_default: true, target_value: 10, period: 'weekly', tracking_mode: 'hybrid', linked_module: 'applications' },
          { user_id: req.user.id, title: 'DSA Practice', icon: 'code', is_default: true, target_value: 5, period: 'weekly', tracking_mode: 'hybrid', linked_module: 'dsa_tracker' },
          { user_id: req.user.id, title: 'Cold Outreach', icon: 'users', is_default: true, target_value: 3, period: 'weekly', tracking_mode: 'hybrid', linked_module: 'networking' }
        ]);
      }
    }

    const payload = [];
    let totalTarget = 0;
    let totalProgress = 0;

    for (const goal of goals) {
      const { start, end } = getPeriodBounds(goal.period);
      const entries = await GoalProgressEntry.find({ goal_id: goal._id, logged_at: { $gte: start, $lte: end } }).sort({ logged_at: -1 });
      
      const currentProgress = entries.reduce((acc, curr) => acc + curr.amount, 0);
      
      if (goal.status === 'active') {
        totalTarget += goal.target_value;
        totalProgress += Math.min(currentProgress, goal.target_value); // Cap at target for overall momentum
      }

      // Get last 8 snapshots for history
      const history = await GoalPeriodSnapshot.find({ goal_id: goal._id }).sort({ period_end: -1 }).limit(8);
      
      const needsReflection = history.length > 0 && !history[0].subjective_feedback;

      payload.push({
        ...goal.toObject(),
        currentProgress,
        entries,
        history: history.reverse(),
        needsReflection: needsReflection ? history[0]._id : null
      });
    }

    // Calculate streak across all goals
    const allEntries = await GoalProgressEntry.find({ user_id: req.user.id }).sort({ logged_at: -1 });
    let streak = 0;
    let prevDateStr = null;
    let todayStr = new Date().toISOString().split('T')[0];
    let yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Simple consecutive day counter
    const uniqueDays = [...new Set(allEntries.map(e => new Date(e.logged_at).toISOString().split('T')[0]))];
    
    if (uniqueDays.includes(todayStr) || uniqueDays.includes(yesterdayStr)) {
      let checkDate = new Date();
      if (!uniqueDays.includes(todayStr)) checkDate.setDate(checkDate.getDate() - 1);
      
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (uniqueDays.includes(dStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 1. Cross-Module Pacing Context (Calendar Load)
    const { start: weekStart, end: weekEnd } = getPeriodBounds('weekly');
    const calendarLoad = await Interview.countDocuments({
      userId: req.user.id,
      scheduledAt: { $gte: weekStart, $lte: weekEnd }
    });

    // 2. Stage-Aware Context
    const offerCount = await Offer.countDocuments({ userId: req.user.id });
    const recentInterviews = await Interview.countDocuments({
      userId: req.user.id,
      scheduledAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    let userStage = 'Pre-interview';
    if (offerCount > 0) userStage = 'Post-offer';
    else if (recentInterviews > 0) userStage = 'Active interview';

    // 3. Sustainable Pace Check-In
    const userSettings = await User.findById(req.user.id).select('publicProfileSettings');
    const isPaceOptOut = userSettings?.publicProfileSettings?.sustainablePaceOptOut || false;
    const showPaceCheck = streak >= 21 && !isPaceOptOut;

    // 4. Capacity Check and Academic Conflict (v3)
    let totalEstimatedGoalTimeMinutes = 0;
    for (const goal of goals) {
      if (goal.status === 'active' && goal.period === 'weekly') {
        totalEstimatedGoalTimeMinutes += goal.target_value * (goal.estimated_time_minutes || 30);
      }
    }

    const weekEvents = await Event.find({
      user: req.user.id,
      date: { $gte: weekStart, $lte: weekEnd },
      status: { $ne: 'cancelled' }
    });

    let totalBusyMinutes = 0;
    let academicEventCount = 0;

    for (const event of weekEvents) {
      if (event.type === 'academic') academicEventCount++;
      
      if (!event.is_all_day) {
        if (event.start_time && event.end_time) {
          const [sh, sm] = event.start_time.split(':').map(Number);
          const [eh, em] = event.end_time.split(':').map(Number);
          const duration = (eh * 60 + em) - (sh * 60 + sm);
          if (duration > 0) totalBusyMinutes += duration;
        } else {
          totalBusyMinutes += 60;
        }
      }
    }

    const availableTimeMinutes = 4200 - totalBusyMinutes; // 70 hrs base
    const capacityWarning = totalEstimatedGoalTimeMinutes > availableTimeMinutes 
      ? { 
          totalGoalHours: Math.round(totalEstimatedGoalTimeMinutes / 60), 
          freeHours: Math.max(0, Math.round(availableTimeMinutes / 60)) 
        } 
      : null;

    const hasAcademicConflict = academicEventCount >= 2;

    res.json({
      goals: payload,
      momentum: totalTarget > 0 ? Math.min(100, Math.round((totalProgress / totalTarget) * 100)) : 0,
      totalTarget,
      totalProgress,
      streak,
      calendarLoad,
      userStage,
      showPaceCheck,
      capacityWarning,
      hasAcademicConflict
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new goal
// @route   POST /api/goals
exports.createGoal = async (req, res) => {
  try {
    const { title, icon, target_value, period, tracking_mode, linked_module } = req.body;
    const goal = await Goal.create({
      user_id: req.user.id,
      title, icon, target_value, period, tracking_mode, linked_module
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
exports.updateGoal = async (req, res) => {
  try {
    const { target_value, period, status, title, pinned } = req.body;
    
    // Only update fields that are provided
    const updateData = {};
    if (target_value !== undefined) updateData.target_value = target_value;
    if (period !== undefined) updateData.period = period;
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (pinned !== undefined) updateData.pinned = pinned;

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      updateData,
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Archive all active goals
// @route   PUT /api/goals/archive-active
exports.archiveActiveGoals = async (req, res) => {
  try {
    const result = await Goal.updateMany(
      { user_id: req.user.id, status: 'active' },
      { $set: { status: 'archived' } }
    );
    res.json({ message: 'Goals archived successfully', count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive a goal (soft delete to preserve snapshots)
// @route   DELETE /api/goals/:id
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { status: 'archived' },
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal archived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add manual progress
// @route   POST /api/goals/:id/progress
exports.addManualProgress = async (req, res) => {
  try {
    const { amount, note, date } = req.body;
    const entry = await GoalProgressEntry.create({
      goal_id: req.params.id,
      user_id: req.user.id,
      amount: amount || 1,
      source: 'manual_adjustment',
      logged_at: date || new Date(),
      note
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Undo/Delete a progress entry
// @route   DELETE /api/goals/progress/:entryId
exports.undoProgress = async (req, res) => {
  try {
    const entry = await GoalProgressEntry.findOneAndDelete({ _id: req.params.entryId, user_id: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Progress undone' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get goal outcome correlation insights
// @route   GET /api/goals/:id/insights
exports.getGoalInsights = async (req, res) => {
  try {
    const snapshots = await GoalPeriodSnapshot.find({ goal_id: req.params.id }).sort({ period_end: -1 });
    
    // We need at least 6 periods of history to prevent noisy stats
    if (snapshots.length < 6) {
      return res.json({ message: null });
    }

    let hitCount = 0;
    let hitWithOutcomeCount = 0;
    let missCount = 0;
    let missWithOutcomeCount = 0;

    for (const snap of snapshots) {
      const isHit = snap.final_completed_value >= snap.target_value_at_period;
      
      const windowStart = new Date(snap.period_end);
      const windowEnd = new Date(snap.period_end);
      windowEnd.setDate(windowEnd.getDate() + 14);

      // Check for interviews or offers within 14 days of the period ending
      const outcomeInterviews = await Interview.countDocuments({
        userId: req.user.id,
        $or: [
          { scheduledAt: { $gte: windowStart, $lte: windowEnd } },
          { createdAt: { $gte: windowStart, $lte: windowEnd } }
        ]
      });

      const outcomeOffers = await Offer.countDocuments({
        userId: req.user.id,
        createdAt: { $gte: windowStart, $lte: windowEnd }
      });

      const hasOutcome = (outcomeInterviews + outcomeOffers) > 0;

      if (isHit) {
        hitCount++;
        if (hasOutcome) hitWithOutcomeCount++;
      } else {
        missCount++;
        if (hasOutcome) missWithOutcomeCount++;
      }
    }

    if (hitCount === 0 || missCount === 0) {
      return res.json({ message: null });
    }

    const hitRate = Math.round((hitWithOutcomeCount / hitCount) * 100);
    const missRate = Math.round((missWithOutcomeCount / missCount) * 100);

    // Only surface if there's a meaningful difference
    if (hitRate > missRate + 10) {
      const msg = `Weeks you hit your goal, you got an interview call within 2 weeks more often than weeks you didn't (${hitRate}% vs ${missRate}%, based on your last ${snapshots.length} periods).`;
      return res.json({ message: msg });
    }

    return res.json({ message: null });
  } catch (error) {
    console.error('getGoalInsights Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get adaptive target suggestion
// @route   GET /api/goals/:id/suggestions
exports.getGoalSuggestions = async (req, res) => {
  try {
    const snapshots = await GoalPeriodSnapshot.find({ goal_id: req.params.id }).sort({ period_end: -1 }).limit(4);
    if (snapshots.length < 2) return res.json({ suggestion: null });

    // Look at subjective feedback first
    const recentFeedback = snapshots.slice(0, 2).map(s => s.subjective_feedback);
    const currentTarget = snapshots[0].target_value_at_period;

    if (recentFeedback[0] === 'too_easy' && recentFeedback[1] === 'too_easy') {
      const suggested = Math.ceil(currentTarget * 1.5);
      return res.json({ suggestion: `This target felt too easy for 2 periods running. Raise the target to ${suggested}?`, suggestedValue: suggested });
    }

    if (recentFeedback[0] === 'too_much' && recentFeedback[1] === 'too_much') {
      const suggested = Math.max(1, Math.floor(currentTarget * 0.75));
      return res.json({ suggestion: `This target has felt like too much lately. Would ${suggested} feel more realistic right now?`, suggestedValue: suggested });
    }

    // Fallback to raw data if we have 4 periods
    if (snapshots.length === 4) {
      const allHits = snapshots.every(s => s.final_completed_value >= s.target_value_at_period);
      if (allHits) {
        const avg = snapshots.reduce((acc, s) => acc + s.final_completed_value, 0) / 4;
        const suggested = Math.ceil(avg);
        if (suggested > currentTarget) {
          return res.json({ suggestion: `You've hit this goal early 4 weeks running — raise the target to ${suggested}?`, suggestedValue: suggested });
        }
      }

      const allMisses = snapshots.every(s => s.final_completed_value < s.target_value_at_period);
      if (allMisses) {
        const avg = snapshots.reduce((acc, s) => acc + s.final_completed_value, 0) / 4;
        const suggested = Math.max(1, Math.round(avg));
        if (suggested < currentTarget) {
          return res.json({ suggestion: `This target hasn't been fully hit in 4 weeks — would ${suggested} feel more realistic right now?`, suggestedValue: suggested });
        }
      }
    }

    res.json({ suggestion: null });
  } catch (error) {
    console.error('getGoalSuggestions Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add subjective feedback to snapshot
// @route   POST /api/goals/snapshots/:id/feedback
exports.addSnapshotFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    const snapshot = await GoalPeriodSnapshot.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { subjective_feedback: feedback },
      { new: true }
    );
    res.json(snapshot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create share link for goals
// @route   POST /api/goals/share
exports.createShareLink = async (req, res) => {
  try {
    const { goalIds } = req.body;
    const token = crypto.randomBytes(20).toString('hex');
    const sharedView = await SharedView.create({
      userId: req.user.id,
      token,
      type: 'goal',
      filters: { goalIds: goalIds || [] },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    res.status(201).json({ token: sharedView.token, link: `/shared/goals/${sharedView.token}` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get shared goals
// @route   GET /api/goals/shared/:token
exports.getSharedGoals = async (req, res) => {
  try {
    const { token } = req.params;
    const sharedView = await SharedView.findOne({ token, type: 'goal', expiresAt: { $gt: new Date() } });
    if (!sharedView) return res.status(404).json({ message: 'Link invalid or expired' });
    
    let query = { user_id: sharedView.userId, status: 'active' };
    if (sharedView.filters.goalIds && sharedView.filters.goalIds.length > 0) {
      query._id = { $in: sharedView.filters.goalIds };
    }
    
    const goals = await Goal.find(query);
    const payload = [];
    for (const goal of goals) {
      const { start, end } = getPeriodBounds(goal.period);
      const entries = await GoalProgressEntry.find({ goal_id: goal._id, logged_at: { $gte: start, $lte: end } }).sort({ logged_at: -1 });
      const currentProgress = entries.reduce((acc, curr) => acc + curr.amount, 0);
      const history = await GoalPeriodSnapshot.find({ goal_id: goal._id }).sort({ period_end: -1 }).limit(4);
      
      payload.push({
        ...goal.toObject(),
        currentProgress,
        history: history.reverse()
      });
    }

    sharedView.viewCount += 1;
    await sharedView.save();

    const user = await User.findById(sharedView.userId).select('name');
    res.json({ user: { name: user.name }, goals: payload });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
