const StudentStreak = require('../models/StudentStreak');
const Badge = require('../models/Badge');
const StudentBadge = require('../models/StudentBadge');
const User = require('../models/User');
const ResourceCompletion = require('../models/ResourceCompletion');
const ResourceUpvote = require('../models/ResourceUpvote');
const ResourceReview = require('../models/ResourceReview');

exports.getStreak = async (req, res) => {
  try {
    const streak = await StudentStreak.findOne({ userId: req.user.id });
    res.json(streak || { currentStreak: 0, longestStreak: 0, lastActivityDate: null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBadges = async (req, res) => {
  try {
    const allBadges = await Badge.find({});
    const earnedBadges = await StudentBadge.find({ userId: req.user.id });
    
    const badgesWithStatus = allBadges.map(badge => {
      const earned = earnedBadges.find(eb => eb.badgeId.toString() === badge._id.toString());
      return {
        ...badge.toObject(),
        earned: !!earned,
        earnedAt: earned ? earned.earnedAt : null
      };
    });

    res.json(badgesWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const period = req.query.period || 'alltime'; // 'week', 'month', 'alltime'
    
    let dateFilter = {};
    if (period === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      dateFilter = { $gte: d };
    } else if (period === 'month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      dateFilter = { $gte: d };
    }

    // Since we need to calculate complex weighted scores (Completions * 3, Upvotes * 1, Reviews * 2, Badges * 5, Streak * 2)
    // and MongoDB aggregations for this can be heavy/complex across 5 collections, 
    // and we need it for top 20, we can aggregate per user, or fetch needed metrics.
    
    // For a production app with thousands of users, it's better to store a materialized `score` field 
    // or run a daily cron. But we can build it via aggregations.
    
    const completionsAgg = await ResourceCompletion.aggregate([
      ...(period !== 'alltime' ? [{ $match: { completedAt: dateFilter } }] : []),
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    
    const upvotesAgg = await ResourceUpvote.aggregate([
      ...(period !== 'alltime' ? [{ $match: { createdAt: dateFilter } }] : []),
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    const reviewsAgg = await ResourceReview.aggregate([
      ...(period !== 'alltime' ? [{ $match: { createdAt: dateFilter } }] : []),
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    const badgesAgg = await StudentBadge.aggregate([
      ...(period !== 'alltime' ? [{ $match: { earnedAt: dateFilter } }] : []),
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    // Streaks don't have a 'period' equivalent really, we just take currentStreak
    const streaks = await StudentStreak.find({}, 'userId currentStreak');

    const scoresMap = {};
    
    const addScore = (arr, multiplier) => {
      arr.forEach(item => {
        const uid = item._id.toString();
        if (!scoresMap[uid]) scoresMap[uid] = { completions: 0, upvotes: 0, reviews: 0, badges: 0, streak: 0, total: 0 };
        scoresMap[uid].total += item.count * multiplier;
        if (multiplier === 3) scoresMap[uid].completions = item.count;
        if (multiplier === 1) scoresMap[uid].upvotes = item.count;
        if (multiplier === 2) scoresMap[uid].reviews = item.count;
        if (multiplier === 5) scoresMap[uid].badges = item.count;
      });
    };

    addScore(completionsAgg, 3);
    addScore(upvotesAgg, 1);
    addScore(reviewsAgg, 2);
    addScore(badgesAgg, 5);

    streaks.forEach(s => {
      const uid = s.userId.toString();
      if (!scoresMap[uid]) scoresMap[uid] = { completions: 0, upvotes: 0, reviews: 0, badges: 0, streak: 0, total: 0 };
      scoresMap[uid].total += s.currentStreak * 2;
      scoresMap[uid].streak = s.currentStreak;
    });

    const userIds = Object.keys(scoresMap);
    const users = await User.find({ _id: { $in: userIds } }, 'name gradYear');

    const leaderboard = users.map(u => {
      const uid = u._id.toString();
      return {
        userId: uid,
        name: u.name,
        gradYear: u.gradYear,
        score: scoresMap[uid].total,
        badgesCount: scoresMap[uid].badges,
        streak: scoresMap[uid].streak
      };
    }).sort((a, b) => b.score - a.score);

    const top20 = leaderboard.slice(0, 20);
    
    // Find current user's rank
    const currentUserIndex = leaderboard.findIndex(u => u.userId === req.user.id);
    let currentUserData = null;
    if (currentUserIndex !== -1) {
      currentUserData = {
        ...leaderboard[currentUserIndex],
        rank: currentUserIndex + 1
      };
    } else {
      // User has 0 score
      const me = await User.findById(req.user.id, 'name gradYear');
      currentUserData = {
        userId: me._id,
        name: me.name,
        gradYear: me.gradYear,
        score: 0,
        badgesCount: 0,
        streak: 0,
        rank: leaderboard.length + 1
      };
    }

    res.json({
      top20: top20.map((u, i) => ({ ...u, rank: i + 1 })),
      currentUser: currentUserData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
