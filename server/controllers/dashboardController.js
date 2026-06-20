const Application = require('../models/Application');
const Interview = require('../models/Interview');
const DSA = require('../models/DSA');
const Goal = require('../models/Goal');
const Contest = require('../models/Contest');
const Offer = require('../models/Offer');
const Network = require('../models/Network');
const User = require('../models/User');
const { GoogleGenAI } = require('@google/genai');

// Helper to interact with Gemini
const callGemini = async (prompt) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process with AI");
  }
};

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

    // Average Network Health
    const avgHealthAggr = await Network.aggregate([
      { $match: { userId: userId, isDeleted: false } },
      { $group: { _id: null, avgHealth: { $avg: '$relationshipHealthScore' } } }
    ]);
    const avgNetworkHealth = avgHealthAggr.length > 0 ? Math.round(avgHealthAggr[0].avgHealth) : 0;
    const decayingContacts = await Network.countDocuments({
      userId: userId,
      isDeleted: false,
      relationshipHealthScore: { $lt: 40 }
    });

    res.json({
      totalApplications,
      activeInterviews,
      offersReceived,
      dsaTopicsTracked,
      currentStreak,
      weeklyGoals,
      avgNetworkHealth,
      decayingContacts,
      hasLoggedDSAToday: dsaSolves.some(d => {
        const dDate = new Date(d.solvedAt);
        dDate.setHours(0,0,0,0);
        let today = new Date();
        today.setHours(0,0,0,0);
        return dDate.getTime() === today.getTime();
      })
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

const getDashboardActivityFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const UnifiedTimeline = require('../models/UnifiedTimeline');
    
    const timelineEvents = await UnifiedTimeline.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedEvents = timelineEvents.map(event => {
      let linkTo = '/';
      switch (event.sourceTable) {
        case 'APPLICATION': linkTo = '/applications'; break;
        case 'INTERVIEW': linkTo = '/interviews'; break;
        case 'DSA': linkTo = '/dsa'; break;
        case 'CONTACT': linkTo = '/networking'; break;
        case 'OFFER': linkTo = '/offers'; break;
        case 'CONTEST': linkTo = '/contests'; break;
        case 'RESUME': linkTo = '/resumes'; break;
        case 'GOAL': linkTo = '/goals'; break;
      }

      return {
        type: event.sourceTable + '_' + event.eventType,
        label: event.title,
        timestamp: event.createdAt,
        linkTo
      };
    });

    res.json(formattedEvents);
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

// @desc    Get dashboard AI Insights
// @route   GET /api/dashboard/ai-insights
// @access  Private
const getAIInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const forceRefresh = req.query.force === 'true';

    // Fetch user to check cache
    const user = await User.findById(userId);
    if (!forceRefresh && user.aiInsightsCache && user.aiInsightsCache.text && user.aiInsightsCache.generatedAt) {
      const hoursSinceGenerated = (Date.now() - user.aiInsightsCache.generatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceGenerated < 6) {
        return res.json({ insights: user.aiInsightsCache.text });
      }
    }

    // Generate new insights
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const apps = await Application.find({ userId, dateApplied: { $gte: thirtyDaysAgo } });
    const interviews = await Interview.find({ userId, createdAt: { $gte: thirtyDaysAgo } });
    const dsa = await DSA.find({ userId, solvedAt: { $gte: thirtyDaysAgo } });
    
    const prompt = `
      You are an expert career coach analyzing a student's placement preparation data for the last 30 days.
      Data:
      - Applications submitted: ${apps.length}
      - Interviews scheduled: ${interviews.length}
      - DSA problems solved: ${dsa.length}
      - Conversion rate (Interviews / Apps): ${apps.length > 0 ? ((interviews.length / apps.length) * 100).toFixed(1) : 0}%
      
      Generate exactly 2 short, punchy bullet point insights based on this data. Make them highly actionable and encouraging.
      Format: Return ONLY the text, separated by a newline. Do not use asterisks, markdown, or numbers. Just the plain text for the two bullets.
      Example 1: Your application-to-interview rate is 12% — industry average is 15-20%. Try tailoring your resume more specifically per company.
      Example 2: You've solved 45 DSA problems this month. Keep this momentum up to master medium-level dynamic programming.
    `;

    const aiResponse = await callGemini(prompt);
    
    user.aiInsightsCache = {
      text: aiResponse.trim(),
      generatedAt: new Date()
    };
    await user.save();

    res.json({ insights: user.aiInsightsCache.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error generating AI insights' });
  }
};

// @desc    Get Readiness Score
// @route   GET /api/dashboard/readiness-score
// @access  Private
const getReadinessScore = async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const appsThisMonth = await Application.countDocuments({ userId, dateApplied: { $gte: thirtyDaysAgo } });
    const dsaThisMonth = await DSA.countDocuments({ userId, solvedAt: { $gte: thirtyDaysAgo } });
    const interviewsAll = await Interview.countDocuments({ userId });
    const networkAll = await Network.countDocuments({ userId });
    const resumeCount = await require('../models/Resume').countDocuments({ user: userId });
    
    // Streak logic (simplified for score)
    const dsaSolves = await DSA.find({ userId }).select('solvedAt').sort({ solvedAt: -1 });
    let streak = 0;
    if (dsaSolves.length > 0) {
      const today = new Date(); today.setHours(0,0,0,0);
      let cDate = new Date(dsaSolves[0].solvedAt); cDate.setHours(0,0,0,0);
      if (today.getTime() - cDate.getTime() <= 86400000) {
        streak = 1;
        // Simple distinct count
      }
    }

    const { start, end } = getWeekBounds();
    const goal = await Goal.findOne({ user: userId, weekStartDate: { $gte: start, $lte: end } });
    let goalCompletion = 0;
    if (goal) {
      const p1 = Math.min(100, goal.applicationsTarget > 0 ? (goal.applicationsCompleted / goal.applicationsTarget) * 100 : 0);
      const p2 = Math.min(100, goal.dsaTarget > 0 ? (goal.dsaCompleted / goal.dsaTarget) * 100 : 0);
      const p3 = Math.min(100, goal.networkingTarget > 0 ? (goal.networkingCompleted / goal.networkingTarget) * 100 : 0);
      goalCompletion = (p1 + p2 + p3) / 3;
    }

    let pointsApps = Math.min(20, appsThisMonth * 1);
    let pointsDSA = Math.min(25, dsaThisMonth * 0.5);
    let pointsStreak = streak >= 7 ? 10 : (streak >= 3 ? 5 : 0);
    let pointsResume = resumeCount > 0 ? 10 : 0;
    let pointsGoals = Math.min(15, (goalCompletion / 100) * 15);
    let pointsInterviews = Math.min(10, interviewsAll * 5);
    let pointsNetwork = Math.min(10, networkAll * 2);

    const score = Math.round(pointsApps + pointsDSA + pointsStreak + pointsResume + pointsGoals + pointsInterviews + pointsNetwork);

    res.json({
      score,
      breakdown: {
        applications: Math.round(pointsApps),
        dsa: Math.round(pointsDSA),
        streak: Math.round(pointsStreak),
        resume: Math.round(pointsResume),
        goals: Math.round(pointsGoals),
        interviews: Math.round(pointsInterviews),
        network: Math.round(pointsNetwork)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching readiness score' });
  }
};

// @desc    Complete Onboarding
// @route   POST /api/dashboard/onboard
// @access  Private
const completeOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.isOnboarded = true;
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error completing onboarding' });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardPipeline,
  getDashboardActivityFeed,
  getDashboardUpcoming,
  getDashboardHeatmap,
  getDashboardCharts,
  getAIInsights,
  getReadinessScore,
  completeOnboarding
};
