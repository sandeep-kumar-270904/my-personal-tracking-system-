const mongoose = require('mongoose');
const StudentStreak = require('../models/StudentStreak');
const Badge = require('../models/Badge');
const StudentBadge = require('../models/StudentBadge');
const Notification = require('../models/Notification');
const ResourceCompletion = require('../models/ResourceCompletion');
const ResourceUpvote = require('../models/ResourceUpvote');
const ResourceReview = require('../models/ResourceReview');
const ResourceSubmission = require('../models/ResourceSubmission');
const Resource = require('../models/Resource');
const Collection = require('../models/Collection');
const StudyGroup = require('../models/StudyGroup');
const WeeklyChallengeCompletion = require('../models/WeeklyChallengeCompletion');
const StudyPlan = require('../models/StudyPlan');

// Ensure dates are compared purely by YYYY-MM-DD
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const updateStreak = async (userId) => {
  try {
    let streak = await StudentStreak.findOne({ userId });
    const today = getStartOfDay();

    if (!streak) {
      streak = new StudentStreak({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today
      });
      await streak.save();
      return streak;
    }

    if (!streak.lastActivityDate) {
      streak.currentStreak = 1;
      streak.longestStreak = Math.max(streak.longestStreak, 1);
      streak.lastActivityDate = today;
      await streak.save();
      return streak;
    }

    const lastActivity = getStartOfDay(streak.lastActivityDate);
    const diffTime = Math.abs(today - lastActivity);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      streak.currentStreak += 1;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      streak.lastActivityDate = today;
      await streak.save();
    } else if (diffDays > 1) {
      // Streak broken
      streak.currentStreak = 1;
      streak.lastActivityDate = today;
      await streak.save();
    }
    // if diffDays === 0, already updated today, do nothing

    return streak;
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

const checkAndAwardBadges = async (userId) => {
  try {
    // 1. Fetch user stats
    const completions = await ResourceCompletion.find({ userId }).populate('resourceId');
    const upvotesCount = await ResourceUpvote.countDocuments({ userId });
    const reviewsCount = await ResourceReview.countDocuments({ userId });
    const approvedSubmissions = await ResourceSubmission.countDocuments({ submittedBy: userId, status: 'approved' });
    const streak = await StudentStreak.findOne({ userId });

    const completionCount = completions.length;
    const completedCategories = [...new Set(completions.filter(c => c.resourceId).map(c => c.resourceId.category))];

    // Determine total resources per category to check "Resource Master"
    // (This is an approximation. If there's a category where completionCount === totalInCategory, they are a master)
    const categoryTotals = await Resource.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    let isMaster = false;
    for (const cat of categoryTotals) {
      const completedInCat = completions.filter(c => c.resourceId && c.resourceId.category === cat._id).length;
      if (completedInCat > 0 && completedInCat >= cat.count) {
        isMaster = true;
        break;
      }
    }

    // Check V5 Conditions
    const enrolledCollections = await Collection.find({ 'enrollments.userId': userId }).populate('items.resourceId');
    const hasEnrolled = enrolledCollections.length > 0;
    
    let hasCompletedACourse = false;
    for (const coll of enrolledCollections) {
      const collItemIds = coll.items.map(item => item.resourceId?._id?.toString()).filter(Boolean);
      const completedResourceIds = completions.map(c => c.resourceId?._id?.toString()).filter(Boolean);
      if (collItemIds.length > 0 && collItemIds.every(id => completedResourceIds.includes(id))) {
        hasCompletedACourse = true;
        break;
      }
    }

    const createdGroups = await StudyGroup.countDocuments({ createdBy: userId });
    const challengeCompletions = await WeeklyChallengeCompletion.countDocuments({ userId });
    
    // Note: team_player logic
    const hasCompletedGroupChallenge = challengeCompletions > 0;

    const studyPlans = await StudyPlan.find({ userId });
    let completedAnyPlanTask = false;
    for (const p of studyPlans) {
      if (p.plan.some(w => w.tasks.some(t => t.completed))) {
        completedAnyPlanTask = true;
        break;
      }
    }


    // 2. Define conditions for badges
    const conditions = {
      'first_step': completionCount >= 1,
      'on_a_roll': completionCount >= 5,
      'halfway_there': completionCount >= 10,
      'resource_master': isMaster,
      'prephub_legend': completionCount >= 25,
      '3_day_warrior': streak && streak.longestStreak >= 3,
      'week_warrior': streak && streak.longestStreak >= 7,
      'unstoppable': streak && streak.longestStreak >= 30,
      'first_upvote': upvotesCount >= 1,
      'helpful_voice': reviewsCount >= 1,
      'community_builder': approvedSubmissions >= 1,
      'explorer': completedCategories.length >= 3,
      'well_rounded': ['DSA', 'Web Dev', 'System Design', 'CS Core', 'Interview Prep'].every(cat => completedCategories.includes(cat)),
      'collector': hasEnrolled,
      'course_complete': hasCompletedACourse,
      'squad_leader': createdGroups > 0,
      'team_player': hasCompletedGroupChallenge,
      'consistent_planner': completedAnyPlanTask
    };

    // 3. Find badges they should earn
    const allBadges = await Badge.find({});
    const earnedBadges = await StudentBadge.find({ userId }).populate('badgeId');
    const earnedBadgeKeys = earnedBadges.map(sb => sb.badgeId.key);

    const newlyEarned = [];

    for (const badge of allBadges) {
      if (conditions[badge.key] && !earnedBadgeKeys.includes(badge.key)) {
        await StudentBadge.create({ userId, badgeId: badge._id });
        newlyEarned.push(badge);
      }
    }

    // 4. Send Notifications for newly earned badges
    if (newlyEarned.length > 0) {
      const notifications = newlyEarned.map(badge => ({
        userId,
        title: 'New Badge Unlocked! 🏅',
        message: `You earned the '${badge.name}' badge ${badge.emoji}`,
        type: 'BADGE_EARNED'
      }));
      await Notification.insertMany(notifications);
    }

    return newlyEarned;
  } catch (error) {
    console.error('Error awarding badges:', error);
  }
};

module.exports = {
  updateStreak,
  checkAndAwardBadges
};
