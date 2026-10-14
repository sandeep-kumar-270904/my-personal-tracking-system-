const Resource = require('../models/Resource');
const DailySpotlight = require('../models/DailySpotlight');
const ResourceCompletion = require('../models/ResourceCompletion');
const ResourceUpvote = require('../models/ResourceUpvote');
const ResourceReview = require('../models/ResourceReview');
const StudentStreak = require('../models/StudentStreak');
const StudentBadge = require('../models/StudentBadge');
const User = require('../models/User');
const Application = require('../models/Application');
const ApplicationTimeline = require('../models/ApplicationTimeline');
const ApplicationSuggestion = require('../models/ApplicationSuggestion');
const Interview = require('../models/Interview');
const generateWeeklyDigestHtml = require('../emails/WeeklyDigest');

const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    let targetCategory = 'DSA';
    let minCount = Infinity;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count < minCount) {
        minCount = count;
        targetCategory = cat;
      }
    }

    // 2. Query candidates from targetCategory
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    const candidates = await Resource.find({
      category: targetCategory,
      isCommunitySubmitted: false, // Ensure curated quality
      $or: [
        { lastSpotlightDate: null },
        { lastSpotlightDate: { $lt: twoMonthsAgo } }
      ]
    });

    if (candidates.length === 0) {
      // Fallback: pick any top-rated resource that hasn't been featured recently
      const fallback = await Resource.findOne({
        isCommunitySubmitted: false,
        $or: [
          { lastSpotlightDate: null },
          { lastSpotlightDate: { $lt: twoMonthsAgo } }
        ]
      }).sort({ rating: -1, upvoteCount: -1 });

      if (!fallback) {
        return res.status(200).json({ message: 'No eligible candidates found for spotlight.' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await DailySpotlight.findOneAndUpdate(
        { date: today },
        {
          resourceId: fallback._id,
          date: today,
          curatorNote: `Hand-picked top resource in ${fallback.category} to boost your preparation.`,
          autoSelected: true
        },
        { upsert: true, new: true }
      );

      fallback.lastSpotlightDate = today;
      await fallback.save();

      return res.status(200).json({ message: 'Fallback spotlight assigned successfully', spotlight: fallback });
    }

    // Score candidates
    let bestCandidate = null;
    let highestScore = -1;

    for (const resItem of candidates) {
      const upvotes = resItem.upvoteCount || 0;
      const rating = resItem.rating || 0;
      const reviewCount = resItem.reviewCount || 0;
      
      const completionsCount = await ResourceCompletion.countDocuments({ resourceId: resItem._id });
      const score = (upvotes * 3) + (rating * 10) + (completionsCount * 2) + (reviewCount * 1.5);

      if (score > highestScore) {
        highestScore = score;
        bestCandidate = resItem;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await DailySpotlight.findOneAndUpdate(
      { date: today },
      {
        resourceId: bestCandidate._id,
        date: today,
        curatorNote: `Algorithmically chosen as this week's highlighted resource in ${targetCategory}.`,
        autoSelected: true
      },
      { upsert: true, new: true }
    );

    bestCandidate.lastSpotlightDate = today;
    await bestCandidate.save();

    res.status(200).json({ message: 'Spotlight selected successfully', spotlight: bestCandidate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.sendWeeklyDigest = async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({ message: 'Resend API key is not configured.' });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get all users who want weekly digest (default to true if not set)
    const users = await User.find({ 'preferences.weeklyDigest': { $ne: false } });

    // Also get top resource overall this week
    const recentCompletionsAll = await ResourceCompletion.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      { $group: { _id: '$resourceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let topResource = null;
    if (recentCompletionsAll.length > 0) {
      topResource = await Resource.findById(recentCompletionsAll[0]._id);
    }

    let sentCount = 0;

    for (const user of users) {
      const completions = await ResourceCompletion.find({
        userId: user._id,
        createdAt: { $gte: oneWeekAgo }
      }).populate('resourceId');

      const streak = await StudentStreak.findOne({ userId: user._id });
      const currentStreak = streak ? streak.currentStreak : 0;

      const upvotes = await ResourceUpvote.countDocuments({
        userId: user._id,
        createdAt: { $gte: oneWeekAgo }
      });

      const reviews = await ResourceReview.countDocuments({
        userId: user._id,
        createdAt: { $gte: oneWeekAgo }
      });

      const newBadgesDocs = await StudentBadge.find({
        userId: user._id,
        createdAt: { $gte: oneWeekAgo }
      });
      const newBadges = newBadgesDocs.map(b => b.badgeKey);

      // Category breakdown
      const categories = ['DSA', 'Web Dev', 'System Design', 'CS Core', 'Interview Prep'];
      const categoryProgress = [];

      for (const cat of categories) {
        const catTotal = await Resource.countDocuments({ category: cat });
        const catCompleted = await ResourceCompletion.countDocuments({
          userId: user._id,
          resourceId: { $in: await Resource.find({ category: cat }).distinct('_id') }
        });

        if (catTotal > 0) {
          categoryProgress.push({
            category: cat,
            completed: catCompleted,
            total: catTotal,
            percentage: Math.round((catCompleted / catTotal) * 100)
          });
        }
      }

      let streakMessage = "Consistency is the fastest route to placement success.";
      if (currentStreak > 7) {
        streakMessage = `Incredible ${currentStreak}-day streak! You're in the top percentile of active learners.`;
      } else if (currentStreak > 0) {
        streakMessage = `${currentStreak} days and counting. Don't break the chain today!`;
      }

      const emailProps = {
        firstName: user.name ? user.name.split(' ')[0] : 'Student',
        resourcesCompleted: completions.length,
        currentStreak,
        upvotesGiven: upvotes,
        reviewsWritten: reviews,
        newBadges,
        categoryProgress,
        topResource,
        recommendedResource: null,
        streakMessage
      };

      const html = generateWeeklyDigestHtml(emailProps);

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
    const resources = await Resource.find({ isCommunitySubmitted: true });
    let brokenCount = 0;

    for (const r of resources) {
      if (!r.url) continue;
      try {
        const response = await fetch(r.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (response.status >= 400) {
          r.isBrokenLink = true;
          await r.save();
          brokenCount++;
        }
      } catch (err) {
        r.isBrokenLink = true;
        await r.save();
        brokenCount++;
      }
    }

    res.json({ message: `Scanned ${resources.length} resources, flagged ${brokenCount} broken links.` });
  } catch (error) {
    console.error('Link rot check error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.recalculateMomentum = async (req, res) => {
  try {
    const apps = await Application.find({
      status: { $nin: ['REJECTED', 'OFFER'] },
      isArchived: false,
      momentumDecay: true
    });

    const now = new Date();

    for (const app of apps) {
      let score = 100;
      
      const latestTimeline = await ApplicationTimeline.findOne({ applicationId: app._id }).sort({ createdAt: -1 });
      const lastActionDate = latestTimeline ? latestTimeline.createdAt : app.createdAt;
      
      const daysSinceAction = Math.floor((now - new Date(lastActionDate)) / (1000 * 60 * 60 * 24));
      const daysSinceApplied = Math.floor((now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24));

      score -= (daysSinceAction * 5);
      
      if (daysSinceApplied >= 14 && app.status === 'APPLIED') {
        score -= 10;
      }

      if (daysSinceAction <= 7 && latestTimeline && latestTimeline.event.includes('Status changed')) {
        score += 20;
      }

      const interviews = await Interview.find({ userId: app.userId, company: app.company, role: app.role });
      
      let hasFutureInterview = false;
      let hasPassedNoDebrief = false;

      interviews.forEach(int => {
        if (new Date(int.scheduledAt) > now) {
          hasFutureInterview = true;
        } else if (new Date(int.scheduledAt) < now && (!int.notes || int.notes.trim() === '')) {
          hasPassedNoDebrief = true;
        }
      });

      if (hasFutureInterview) score += 15;
      if (hasPassedNoDebrief) score -= 20;

      app.momentumScore = Math.max(0, Math.min(100, score));
      await app.save();
    }

    res.json({ message: `Recalculated momentum for ${apps.length} applications` });
  } catch (error) {
    console.error('Momentum cron error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.checkStatusSignals = async (req, res) => {
  try {
    const apps = await Application.find({ isArchived: false, status: { $nin: ['REJECTED', 'OFFER'] } });
    const now = new Date();
    let suggestionsCreated = 0;

    for (const app of apps) {
      const daysSinceApplied = Math.floor((now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24));
      
      if (app.status === 'APPLIED' && daysSinceApplied >= 21) {
        const existing = await ApplicationSuggestion.findOne({ applicationId: app._id, suggestionType: 'GHOSTED' });
        if (!existing) {
          await ApplicationSuggestion.create({
            applicationId: app._id,
            userId: app.userId,
            suggestionType: 'GHOSTED',
            suggestedStatus: 'REJECTED',
            reason: '21+ days passed with no update since applying.'
          });
          suggestionsCreated++;
        }
      }

      if (app.status === 'OA_PENDING' && daysSinceApplied >= 7) {
        const existing = await ApplicationSuggestion.findOne({ applicationId: app._id, suggestionType: 'CHECK_OA' });
        if (!existing) {
          await ApplicationSuggestion.create({
            applicationId: app._id,
            userId: app.userId,
            suggestionType: 'CHECK_OA',
            suggestedStatus: 'OA_DONE',
            reason: '7+ days since OA Pending. Did you receive it in your email?'
          });
          suggestionsCreated++;
        }
      }

      if (app.status === 'INTERVIEW_SCHEDULED') {
        const pastInterview = await Interview.findOne({ 
          userId: app.userId, 
          company: app.company, 
          role: app.role,
          scheduledAt: { $lt: now } 
        });

        if (pastInterview) {
          const existing = await ApplicationSuggestion.findOne({ applicationId: app._id, suggestionType: 'UPDATE_AFTER_INTERVIEW' });
          if (!existing) {
            await ApplicationSuggestion.create({
              applicationId: app._id,
              userId: app.userId,
              suggestionType: 'UPDATE_AFTER_INTERVIEW',
              suggestedStatus: 'SHORTLISTED',
              reason: 'Scheduled interview has passed. Have you heard back?'
            });
            suggestionsCreated++;
          }
        }
      }
    }

    res.json({ message: `Created ${suggestionsCreated} status suggestions` });
  } catch (error) {
    console.error('Status signal cron error:', error);
    res.status(500).json({ error: error.message });
  }
};
