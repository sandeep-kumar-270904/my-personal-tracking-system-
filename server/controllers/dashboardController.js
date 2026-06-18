const Application = require('../models/Application');
const Interview = require('../models/Interview');
const DSA = require('../models/DSA');
const Goal = require('../models/Goal');
const Contest = require('../models/Contest');
const Offer = require('../models/Offer');
const Network = require('../models/Network');

// Helper to get start and end of week (Sunday to Saturday)
const getWeekBounds = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0,0,0,0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23,59,59,999);
  return { start, end };
};

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total Applications
    const totalApplications = await Application.countDocuments({ userId });

    // Active Interviews
    const activeInterviews = await Interview.countDocuments({ userId, status: 'UPCOMING' });

    // Offers Received
    const offersReceived = await Application.countDocuments({ userId, status: 'OFFER' });

    // DSA Topics Tracked
    const dsaTopics = await DSA.distinct('topic', { userId });
    const dsaTopicsTracked = dsaTopics.length;

    // Current Streak (consecutive days of DSA solves)
    const dsaSolves = await DSA.find({ userId }).select('solvedAt').sort({ solvedAt: -1 });
    let currentStreak = 0;
    if (dsaSolves.length > 0) {
      let lastDate = new Date();
      lastDate.setHours(0,0,0,0);
      let streakActive = true;
      let checkDate = new Date(lastDate);

      // Check if they solved today
      const solvedToday = dsaSolves.some(d => {
        const dDate = new Date(d.solvedAt);
        dDate.setHours(0,0,0,0);
        return dDate.getTime() === checkDate.getTime();
      });

      if (!solvedToday) {
        // If not today, check if they solved yesterday (maybe they haven't solved yet today but streak is from yesterday)
        checkDate.setDate(checkDate.getDate() - 1);
        const solvedYesterday = dsaSolves.some(d => {
          const dDate = new Date(d.solvedAt);
          dDate.setHours(0,0,0,0);
          return dDate.getTime() === checkDate.getTime();
        });
        if (!solvedYesterday) {
          streakActive = false; // no streak
        }
      }

      if (streakActive) {
        // Count backwards
        let uniqueDates = new Set();
        dsaSolves.forEach(d => {
          const dDate = new Date(d.solvedAt);
          dDate.setHours(0,0,0,0);
          uniqueDates.add(dDate.getTime());
        });
        const datesArr = Array.from(uniqueDates).sort((a,b) => b - a);
        
        let cDate = new Date(datesArr[0]);
        for(let i=0; i<datesArr.length; i++) {
          if (datesArr[i] === cDate.getTime()) {
            currentStreak++;
            cDate.setDate(cDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Weekly Goals
    const { start, end } = getWeekBounds();
    let weeklyGoals = await Goal.findOne({ user: userId, weekStartDate: { $gte: start, $lte: end } });
    
    // Auto calculate if missing or exist
    if (!weeklyGoals) {
      weeklyGoals = new Goal({
        user: userId,
        weekStartDate: start,
      });
      await weeklyGoals.save();
    }
    
    // Calculate completions for this week
    const applicationsCompleted = await Application.countDocuments({ userId, dateApplied: { $gte: start, $lte: end } });
    const dsaCompleted = await DSA.countDocuments({ userId, solvedAt: { $gte: start, $lte: end } });
    const networkingCompleted = await Network.countDocuments({ userId, lastContactDate: { $gte: start, $lte: end }, outreachStatus: { $ne: 'NOT_CONTACTED' } });

    weeklyGoals.applicationsCompleted = applicationsCompleted;
    weeklyGoals.dsaCompleted = dsaCompleted;
    weeklyGoals.networkingCompleted = networkingCompleted;
    await weeklyGoals.save();

    res.json({
      totalApplications,
      activeInterviews,
      offersReceived,
      dsaTopicsTracked,
      currentStreak,
      weeklyGoals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching stats' });
  }
};

// @desc    Get dashboard pipeline
// @route   GET /api/dashboard/pipeline
// @access  Private
const getDashboardPipeline = async (req, res) => {
  try {
    const userId = req.user._id;
    const applications = await Application.find({ userId }).sort({ updatedAt: -1 });

    const pipeline = {
      APPLIED: [],
      OA_PENDING: [],
      OA_DONE: [],
      INTERVIEW_SCHEDULED: [],
      SHORTLISTED: [],
      OFFER: [],
      REJECTED: []
    };

    applications.forEach(app => {
      if (pipeline[app.status]) {
        pipeline[app.status].push({
          id: app._id,
          company: app.company,
          role: app.role,
          dateApplied: app.dateApplied
        });
      }
    });

    res.json(pipeline);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching pipeline' });
  }
};

// @desc    Get dashboard activity feed
// @route   GET /api/dashboard/activity-feed
// @access  Private
const getDashboardActivityFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const events = [];

    const apps = await Application.find({ userId }).sort({ createdAt: -1 }).limit(10);
    apps.forEach(app => events.push({
      type: 'APPLICATION_ADDED',
      label: `Applied to ${app.company} — ${app.role}`,
      timestamp: app.createdAt,
      linkTo: '/applications'
    }));

    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 }).limit(10);
    interviews.forEach(int => events.push({
      type: 'INTERVIEW_SCHEDULED',
      label: `Interview Scheduled with ${int.company} — ${int.round}`,
      timestamp: int.createdAt,
      linkTo: '/interviews'
    }));

    const dsas = await DSA.find({ userId }).sort({ createdAt: -1 }).limit(10);
    dsas.forEach(dsa => events.push({
      type: 'DSA_SOLVED',
      label: `Solved ${dsa.topic} (${dsa.difficulty}) on ${dsa.platform}`,
      timestamp: dsa.createdAt,
      linkTo: '/dsa'
    }));

    const offers = await Application.find({ userId, status: 'OFFER' }).sort({ updatedAt: -1 }).limit(10);
    offers.forEach(o => events.push({
      type: 'OFFER_RECEIVED',
      label: `Offer Received from ${o.company}!`,
      timestamp: o.updatedAt,
      linkTo: '/offers'
    }));

    // Sort all events by timestamp desc and take top 10
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(events.slice(0, 10));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching activity' });
  }
};

// @desc    Get dashboard upcoming
// @route   GET /api/dashboard/upcoming
// @access  Private
const getDashboardUpcoming = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const items = [];

    // Future Interviews
    const interviews = await Interview.find({ userId, scheduledAt: { $gt: now } });
    interviews.forEach(int => {
      const diffDays = (new Date(int.scheduledAt) - now) / (1000 * 60 * 60 * 24);
      items.push({
        type: 'INTERVIEW',
        title: `${int.company} Interview`,
        subtitle: int.round,
        date: int.scheduledAt,
        urgency: diffDays < 2 ? 'HIGH' : diffDays < 5 ? 'MEDIUM' : 'LOW',
        linkTo: '/interviews'
      });
    });

    // Upcoming Contests with reminderSet
    const contests = await Contest.find({ userId, startsAt: { $gt: now }, reminderSet: true });
    contests.forEach(c => {
      const diffDays = (new Date(c.startsAt) - now) / (1000 * 60 * 60 * 24);
      items.push({
        type: 'CONTEST',
        title: c.name,
        subtitle: c.platform,
        date: c.startsAt,
        urgency: diffDays < 1 ? 'HIGH' : diffDays < 3 ? 'MEDIUM' : 'LOW',
        linkTo: '/contests'
      });
    });

    // Offer deadlines within 7 days
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const offers = await Offer.find({ userId, deadline: { $gt: now, $lte: nextWeek } });
    offers.forEach(o => {
      const diffDays = (new Date(o.deadline) - now) / (1000 * 60 * 60 * 24);
      items.push({
        type: 'OFFER_DEADLINE',
        title: `${o.company} Offer Deadline`,
        subtitle: o.role,
        date: o.deadline,
        urgency: diffDays < 2 ? 'HIGH' : diffDays < 5 ? 'MEDIUM' : 'LOW',
        linkTo: '/offers'
      });
    });

    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(items.slice(0, 5));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching upcoming' });
  }
};

// @desc    Get dashboard heatmap
// @route   GET /api/dashboard/heatmap
// @access  Private
const getDashboardHeatmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const dsas = await DSA.find({ userId, solvedAt: { $gte: twelveWeeksAgo } });
    
    const heatmapMap = {};
    dsas.forEach(dsa => {
      const dateStr = new Date(dsa.solvedAt).toISOString().split('T')[0];
      heatmapMap[dateStr] = (heatmapMap[dateStr] || 0) + 1;
    });

    const heatmap = Object.keys(heatmapMap).map(date => ({
      date,
      count: heatmapMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(heatmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching heatmap' });
  }
};

// @desc    Get dashboard charts
// @route   GET /api/dashboard/charts
// @access  Private
const getDashboardCharts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Applications last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentApps = await Application.find({ userId, dateApplied: { $gte: thirtyDaysAgo } });
    
    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last30Days.push({ date: d.toISOString().split('T')[0], count: 0 });
    }
    
    recentApps.forEach(app => {
      if (app.dateApplied) {
        const dateStr = new Date(app.dateApplied).toISOString().split('T')[0];
        const dayData = last30Days.find(d => d.date === dateStr);
        if (dayData) dayData.count += 1;
      }
    });

    // Pipeline Breakdown
    const allApps = await Application.find({ userId });
    const pipelineBreakdown = {
      APPLIED: 0, OA_PENDING: 0, OA_DONE: 0, INTERVIEW_SCHEDULED: 0, SHORTLISTED: 0, REJECTED: 0, OFFER: 0
    };
    allApps.forEach(app => {
      if (pipelineBreakdown[app.status] !== undefined) {
        pipelineBreakdown[app.status] += 1;
      }
    });

    // Activity by day (0=Sun, 6=Sat)
    const allDsas = await DSA.find({ userId });
    const activityByDayMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    allApps.forEach(app => {
      if (app.dateApplied) {
        activityByDayMap[new Date(app.dateApplied).getDay()] += 1;
      }
    });
    allDsas.forEach(dsa => {
      if (dsa.solvedAt) {
        activityByDayMap[new Date(dsa.solvedAt).getDay()] += 1;
      }
    });
    const activityByDay = Object.keys(activityByDayMap).map(k => ({ day: parseInt(k), count: activityByDayMap[k] }));

    // DSA by Difficulty
    const dsaByDifficulty = {
      EASY: 0, MEDIUM: 0, HARD: 0
    };
    allDsas.forEach(dsa => {
      if (dsaByDifficulty[dsa.difficulty] !== undefined) {
        dsaByDifficulty[dsa.difficulty] += 1;
      }
    });

    res.json({
      applicationsLast30Days: last30Days,
      pipelineBreakdown,
      activityByDay,
      dsaByDifficulty
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching charts' });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardPipeline,
  getDashboardActivityFeed,
  getDashboardUpcoming,
  getDashboardHeatmap,
  getDashboardCharts
};
