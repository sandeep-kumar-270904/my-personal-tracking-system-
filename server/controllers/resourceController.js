const Resource = require('../models/Resource');
const ResourceUpvote = require('../models/ResourceUpvote');
const ResourceCompletion = require('../models/ResourceCompletion');
const ResourceBookmark = require('../models/ResourceBookmark');
const ResourceReview = require('../models/ResourceReview');
const ResourceSubmission = require('../models/ResourceSubmission');
const DailySpotlight = require('../models/DailySpotlight');
const Notification = require('../models/Notification');
const DSATopic = require('../models/DSATopic');
const Interview = require('../models/Interview');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const gamificationService = require('../services/gamificationService');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const recommendCache = new Map();

const getResources = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const matchStage = req.user.role === 'placement_cell_admin' ? {} : { isPublished: true };

    const resources = await Resource.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'resourceupvotes', localField: '_id', foreignField: 'resourceId', as: 'upvotes' } },
      { $lookup: { from: 'resourcecompletions', localField: '_id', foreignField: 'resourceId', as: 'completions' } },
      { $lookup: { from: 'resourcebookmarks', localField: '_id', foreignField: 'resourceId', as: 'bookmarks' } },
      { $lookup: { from: 'resourcereviews', localField: '_id', foreignField: 'resourceId', as: 'reviews' } },
      {
        $project: {
          id: '$_id',
          _id: 0,
          title: 1,
          description: 1,
          url: 1,
          category: 1,
          difficulty: 1,
          icon: 1,
          createdAt: 1,
          upvoteCount: { $size: '$upvotes' },
          completionCount: { $size: '$completions' },
          hasUpvoted: { $in: [userId, '$upvotes.userId'] },
          hasCompleted: { $in: [userId, '$completions.userId'] },
          hasBookmarked: { $in: [userId, '$bookmarks.userId'] },
          reviewCount: { $size: '$reviews' },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $round: [{ $avg: '$reviews.rating' }, 1] },
              else: 0
            }
          },
          userReview: {
            $arrayElemAt: [
              { $filter: { input: '$reviews', as: 'review', cond: { $eq: ['$$review.userId', userId] } } },
              0
            ]
          },
          isPublished: 1
        }
      }
    ]);

    res.json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const toggleUpvote = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const existing = await ResourceUpvote.findOne({ resourceId, userId });
    if (existing) {
      await ResourceUpvote.deleteOne({ _id: existing._id });
      res.json({ message: 'Upvote removed', hasUpvoted: false });
    } else {
      await ResourceUpvote.create({ resourceId, userId });
      
      // Async gamification check (fire and forget)
      gamificationService.checkAndAwardBadges(userId).catch(console.error);
      
      res.json({ message: 'Upvoted successfully', hasUpvoted: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const toggleComplete = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const existing = await ResourceCompletion.findOne({ resourceId, userId });
    if (existing) {
      await ResourceCompletion.deleteOne({ _id: existing._id });
      recommendCache.delete(`recommend:${userId}`); // Bust cache
      res.json({ message: 'Completion removed', hasCompleted: false });
    } else {
      await ResourceCompletion.create({ resourceId, userId });
      recommendCache.delete(`recommend:${userId}`); // Bust cache
      
      // Gamification
      const streakData = await gamificationService.updateStreak(userId);
      gamificationService.checkAndAwardBadges(userId).catch(console.error);
      
      // Cross-page sync
      prepHubSyncService.onResourceCompleted(userId, resourceId).catch(console.error);

      res.json({ message: 'Marked as completed', hasCompleted: true, streak: streakData });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const existing = await ResourceBookmark.findOne({ resourceId, userId });
    if (existing) {
      await ResourceBookmark.deleteOne({ _id: existing._id });
      recommendCache.delete(`recommend:${userId}`); // Bust cache
      res.json({ message: 'Bookmark removed', hasBookmarked: false });
    } else {
      await ResourceBookmark.create({ resourceId, userId });
      recommendCache.delete(`recommend:${userId}`); // Bust cache
      res.json({ message: 'Bookmarked successfully', hasBookmarked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getReviews = async (req, res) => {
  try {
    const reviews = await ResourceReview.find({ resourceId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });
    
    // Format to only send first name and initials if needed for privacy as requested
    const formatted = reviews.map(r => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        firstName: r.userId.name ? r.userId.name.split(' ')[0] : 'Student',
        avatar: r.userId.avatar || null
      }
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const postReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Valid rating required' });
    if (comment && comment.length > 200) return res.status(400).json({ message: 'Comment exceeds 200 chars' });

    const resourceId = req.params.id;
    const userId = req.user.id;

    const review = await ResourceReview.findOneAndUpdate(
      { resourceId, userId },
      { rating, comment },
      { upsert: true, new: true }
    );
    
    gamificationService.checkAndAwardBadges(userId).catch(console.error);
    
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const recommendResources = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `recommend:${userId}`;
    
    if (recommendCache.has(cacheKey)) {
      const cachedTime = recommendCache.get(`${cacheKey}:time`);
      if (Date.now() - cachedTime < 6 * 60 * 60 * 1000) {
        return res.json(recommendCache.get(cacheKey));
      }
    }

    // 1. Weak DSA Topics
    const weakTopics = await DSATopic.find({ userId })
      .sort({ weaknessScore: -1 })
      .limit(3)
      .select('topicName weaknessScore');
      
    // 2. Interview gaps (Failed interviews)
    const failedInterviews = await Interview.find({ userId, outcome: 'FAILED' })
      .sort({ scheduledAt: -1 })
      .limit(3)
      .select('company role feedbackReceived debrief');

    // 3. Available resources not completed
    const completedIds = await ResourceCompletion.find({ userId }).distinct('resourceId');
    const allResources = await Resource.find({ _id: { $nin: completedIds } })
      .select('_id title category difficulty description');

    if (weakTopics.length === 0 && failedInterviews.length === 0) {
      // Fallback
      return res.json([]);
    }

    const prompt = `
      You are a study advisor for a college student preparing for campus placements. Based on their weak topics and interview gaps provided, recommend exactly 4 resources from the given resource list that would help them the most right now. Return ONLY a JSON array of resource IDs in order of priority. No explanation, no markdown, just the JSON array. Example: ["id1", "id2", "id3", "id4"]

      Student weak topics: ${JSON.stringify(weakTopics)}
      Interview gaps: ${JSON.stringify(failedInterviews)}
      Available resources: ${JSON.stringify(allResources)}
    `;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let text = aiResponse.text;
    const match = text.match(/\[.*\]/s);
    if (match) text = match[0];
    
    const recommendedIds = JSON.parse(text);
    
    const finalResources = await Resource.find({ _id: { $in: recommendedIds } });
    
    // Format output just like getResources mapping
    const formatted = finalResources.map(r => ({
      id: r._id,
      title: r.title,
      description: r.description,
      category: r.category,
      difficulty: r.difficulty,
      icon: r.icon,
      url: r.url
    }));

    recommendCache.set(cacheKey, formatted);
    recommendCache.set(`${cacheKey}:time`, Date.now());

    res.json(formatted);
  } catch (error) {
    console.error('Recommend Resources error:', error);
    res.status(500).json({ message: 'Failed to recommend resources' });
  }
};

const reportBrokenLink = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    
    resource.reportedBroken = true;
    await resource.save();

    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report resource' });
  }
};

const getSpotlight = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const spotlight = await DailySpotlight.findOne({ date: { $gte: startOfDay } })
      .sort({ date: 1 })
      .populate('resourceId');
      
    if (!spotlight || !spotlight.resourceId) return res.json(null);

    const resourceId = spotlight.resourceId._id;
    const userId = req.user.id;

    // Fetch upvote/completion counts
    const upvotes = await ResourceUpvote.countDocuments({ resourceId });
    const completions = await ResourceCompletion.countDocuments({ resourceId });
    const hasBookmarked = await ResourceBookmark.exists({ resourceId, userId });

    res.json({
      ...spotlight.resourceId.toObject(),
      upvoteCount: upvotes,
      completionCount: completions,
      hasBookmarked: !!hasBookmarked
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitResource = async (req, res) => {
  try {
    const { url } = req.body;

    // Patch 15: Duplicate Resource Detection
    // Check if it exists in active resources
    const existingResource = await Resource.findOne({ url });
    if (existingResource) {
      return res.status(400).json({ message: 'A resource with this URL already exists in the platform.' });
    }

    // Check if it exists in pending/approved submissions
    const existingSubmission = await ResourceSubmission.findOne({ 
      url, 
      status: { $in: ['pending', 'approved'] } 
    });
    if (existingSubmission) {
      return res.status(400).json({ message: 'A submission with this URL is already pending or approved.' });
    }

    const submission = await ResourceSubmission.create({
      ...req.body,
      submittedBy: req.user.id
    });

    // Notify admins (all users with placement_cell_admin role)
    const User = require('../models/User');
    const admins = await User.find({ role: 'placement_cell_admin' });
    
    const notifications = admins.map(admin => ({
      userId: admin._id,
      title: 'New Resource Submitted',
      message: `📥 New resource submitted by a student: '${submission.name}'`,
      type: 'NEW_RESOURCE_SUBMISSION'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const submissions = await ResourceSubmission.find({ submittedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getResources,
  toggleUpvote,
  toggleComplete,
  toggleBookmark,
  getReviews,
  postReview,
  recommendResources,
  getSpotlight,
  submitResource,
  getMySubmissions,
  reportBrokenLink
};
