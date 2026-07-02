const Resource = require('../models/Resource');
const DailySpotlight = require('../models/DailySpotlight');
const ResourceCompletion = require('../models/ResourceCompletion');
const ResourceUpvote = require('../models/ResourceUpvote');
const ResourceReview = require('../models/ResourceReview');
const StudentStreak = require('../models/StudentStreak');
const StudentBadge = require('../models/StudentBadge');
const User = require('../models/User');

const babelRegister = require('@babel/register');
(babelRegister.default || babelRegister)({
  presets: ['@babel/preset-react'],
  extensions: ['.jsx', '.js']
});

const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
let WeeklyDigestTemplate;
try {
  WeeklyDigestTemplate = require('../emails/WeeklyDigest.jsx');
} catch (e) {
  console.error("Failed to load React Email template", e);
}

exports.autoSelectSpotlight = async (req, res) => {
  try {
    // 1. Find category with fewest completions this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get all completions this week
    const recentCompletions = await ResourceCompletion.find({ createdAt: { $gte: oneWeekAgo } }).populate('resourceId');
    
    const categoryCounts = { 'DSA': 0, 'Web Dev': 0, 'System Design': 0, 'CS Core': 0, 'Interview Prep': 0 };
    recentCompletions.forEach(c => {
      if (c.resourceId && categoryCounts[c.resourceId.category] !== undefined) {
        categoryCounts[c.resourceId.category]++;
      }
    });

    let minCategory = 'DSA';
    let minCount = Infinity;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count < minCount) {
        minCount = count;
        minCategory = cat;
      }
    });

    // 2. Find resource with highest upvotes in this category NOT spotlighted in last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const recentSpotlights = await DailySpotlight.find({ date: { $gte: fourteenDaysAgo } });
    const excludedIds = recentSpotlights.map(s => s.resourceId);

    // Need to get upvote counts. Since upvoteCount is computed on the fly or we can just query all and sort manually
    // For simplicity, we just fetch resources in the category, sort them by upvotes
    const resources = await Resource.aggregate([
      { $match: { category: minCategory, _id: { $nin: excludedIds }, isPublished: true } },
      { $lookup: { from: 'resourceupvotes', localField: '_id', foreignField: 'resourceId', as: 'upvotes' } },
      { $addFields: { upvoteCount: { $size: '$upvotes' } } },
      { $sort: { upvoteCount: -1 } },
      { $limit: 1 }
    ]);

    let selectedResource = resources.length > 0 ? resources[0]._id : null;

    // Fallback if none found
    if (!selectedResource) {
      const fallback = await Resource.findOne({ isPublished: true });
      if (fallback) selectedResource = fallback._id;
    }

    if (selectedResource) {
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      
      await DailySpotlight.findOneAndUpdate(
        { date: { $gte: startOfDay } },
        { resourceId: selectedResource, date: new Date(), isManual: false },
        { upsert: true, new: true }
      );
      
      return res.json({ message: 'Spotlight auto-selected successfully', resourceId: selectedResource });
    }

    res.status(404).json({ message: 'No resources available for spotlight' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendWeeklyDigest = async (req, res) => {
  try {
    // 1. Check authorization
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!WeeklyDigestTemplate || !resend) {
      return res.status(500).json({ message: 'Email template or Resend not configured' });
    }

    // 2. Fetch users opted into digest
    const users = await User.find({ 'notificationPreferences.emailDigest': true });
    
    let sentCount = 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 3. For each user, compute stats and send email
    for (const user of users) {
      const userId = user._id;

      const completions = await ResourceCompletion.find({ userId, completedAt: { $gte: oneWeekAgo } }).populate('resourceId');
      const upvotes = await ResourceUpvote.countDocuments({ userId, createdAt: { $gte: oneWeekAgo } });
      const reviews = await ResourceReview.countDocuments({ userId, createdAt: { $gte: oneWeekAgo } });
      
      const streakObj = await StudentStreak.findOne({ userId });
      const currentStreak = streakObj ? streakObj.currentStreak : 0;
      
      const newBadgesDocs = await StudentBadge.find({ userId, earnedAt: { $gte: oneWeekAgo } }).populate('badgeId');
      const newBadges = newBadgesDocs.map(b => b.badgeId.name);

      // Top Resource (Global)
      const topResources = await Resource.aggregate([
        { $match: { isPublished: true, createdAt: { $gte: oneWeekAgo } } },
        { $lookup: { from: 'resourceupvotes', localField: '_id', foreignField: 'resourceId', as: 'upvotes' } },
        { $project: { title: 1, category: 1, difficulty: 1, url: 1, upvotes: { $size: '$upvotes' } } },
        { $sort: { upvotes: -1 } },
        { $limit: 1 }
      ]);
      const topResource = topResources.length > 0 ? topResources[0] : null;

      let streakMessage = "Start a streak this week — complete one resource today!";
      if (currentStreak > 7) streakMessage = `🔥 You're on a ${currentStreak} day streak — incredible!`;
      else if (currentStreak >= 3) streakMessage = `⚡ ${currentStreak} days in a row! Keep the momentum going.`;
      else if (currentStreak >= 1) streakMessage = `You've got ${currentStreak} days going. 3 days unlocks the '3 Day Warrior' badge!`;

      // Category Progress
      // Simplified: just get their completions grouped by category.
      const categoryCounts = {};
      for (const c of completions) {
        if (c.resourceId) {
          const cat = c.resourceId.category;
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }
      const categoryProgress = [];
      for (const cat in categoryCounts) {
        // approx total:
        const total = await Resource.countDocuments({ category: cat, isPublished: true });
        const percentage = total > 0 ? Math.round((categoryCounts[cat] / total) * 100) : 0;
        categoryProgress.push({ category: cat, completed: categoryCounts[cat], total, percentage });
      }

      const emailProps = {
        firstName: user.name.split(' ')[0],
        resourcesCompleted: completions.length,
        currentStreak,
        upvotesGiven: upvotes,
        reviewsWritten: reviews,
        newBadges,
        categoryProgress,
        topResource,
        recommendedResource: null, // Skip recommended resource for brevity unless cached
        streakMessage
      };

      // Since the actual render returns a promise (it's async in newer @react-email/render)
      // Actually @react-email/render `render` can be async or sync depending on version, wait let's use async:
      const { render } = require('@react-email/render');
      const html = await render(WeeklyDigestTemplate(emailProps));

      await resend.emails.send({
        from: 'PrepHub <noreply@your-domain.com>',
        to: user.email,
        subject: `Your PrepHub Week in Review 📚 — ${completions.length} resources completed`,
        html: html
      });
      sentCount++;
    }

    res.json({ message: `Successfully sent ${sentCount} weekly digests.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.checkLinkRot = async (req, res) => {
  try {
    const resources = await Resource.find({ isPublished: true });
    let checkedCount = 0;
    let brokenCount = 0;

    for (const resource of resources) {
      try {
        const response = await fetch(resource.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        const isAlive = response.ok;
        
        if (!isAlive && resource.isAlive) {
          // Try GET just in case HEAD is blocked
          const getResponse = await fetch(resource.url, { method: 'GET', signal: AbortSignal.timeout(5000) });
          if (!getResponse.ok) {
            brokenCount++;
            resource.isAlive = false;
          }
        } else if (isAlive && !resource.isAlive) {
          resource.isAlive = true;
        }
      } catch (err) {
        if (resource.isAlive) {
          brokenCount++;
          resource.isAlive = false;
        }
      }
      
      resource.lastCheckedAt = new Date();
      await resource.save();
      checkedCount++;
    }

    res.json({ message: 'Link rot check complete', checkedCount, brokenCount });
  } catch (error) {
    console.error('Link rot check failed:', error);
    res.status(500).json({ message: error.message });
  }
};
