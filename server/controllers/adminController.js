const PlacementDriveBroadcast = require('../models/PlacementDriveBroadcast');
const ResourceSubmission = require('../models/ResourceSubmission');
const Resource = require('../models/Resource');
const DailySpotlight = require('../models/DailySpotlight');
const Notification = require('../models/Notification');
const gamificationService = require('../services/gamificationService');
const ResourceCompletion = require('../models/ResourceCompletion');
const ResourceUpvote = require('../models/ResourceUpvote');
const ResourceReview = require('../models/ResourceReview');
const AdminAuditLog = require('../models/AdminAuditLog');

// @desc    Create a new placement drive broadcast
// @route   POST /api/admin/broadcasts
// @access  Private (Admin only)
exports.createDriveBroadcast = async (req, res) => {
  try {
    const { companyName, roles, eligibleBranches, description, deadline, applyLink } = req.body;

    const broadcast = await PlacementDriveBroadcast.create({
      companyName,
      roles: roles ? roles.split(',').map(r => r.trim()) : [],
      eligibleBranches: eligibleBranches ? eligibleBranches.split(',').map(b => b.trim()) : [],
      description,
      deadline,
      applyLink,
      createdBy: req.user.id
    });

    res.status(201).json(broadcast);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await ResourceSubmission.find({})
      .populate('submittedBy', 'name college gradYear')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveSubmission = async (req, res) => {
  try {
    const { estimatedHours } = req.body;
    const submission = await ResourceSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    
    // Create actual Resource
    const newResource = await Resource.create({
      title: submission.name,
      url: submission.url,
      category: submission.category,
      difficulty: submission.difficulty,
      description: submission.description,
      icon: 'BookOpen', // default
      isPublished: true,
      estimatedHours: estimatedHours || 0
    });

    submission.status = 'approved';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    await submission.save();

    await Notification.create({
      userId: submission.submittedBy,
      title: 'Resource Approved',
      message: `✅ Your resource '${submission.name}' has been approved and is now live!`,
      type: 'RESOURCE_SUBMISSION_APPROVED',
      link: '/prephub'
    });

    gamificationService.checkAndAwardBadges(submission.submittedBy).catch(console.error);

    await AdminAuditLog.create({
      adminId: req.user.id,
      action: 'APPROVE_SUBMISSION',
      resourceType: 'ResourceSubmission',
      resourceId: submission._id,
      details: { newResourceId: newResource._id },
      ipAddress: req.ip
    });

    res.json({ message: 'Approved', resource: newResource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectSubmission = async (req, res) => {
  try {
    const { reason } = req.body;
    const submission = await ResourceSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.status = 'rejected';
    submission.adminNote = reason;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    await submission.save();

    await Notification.create({
      userId: submission.submittedBy,
      title: 'Resource Rejected',
      message: `❌ Your resource '${submission.name}' was not approved. Reason: ${reason}`,
      type: 'RESOURCE_SUBMISSION_REJECTED'
    });

    await AdminAuditLog.create({
      adminId: req.user.id,
      action: 'REJECT_SUBMISSION',
      resourceType: 'ResourceSubmission',
      resourceId: submission._id,
      details: { reason },
      ipAddress: req.ip
    });

    res.json({ message: 'Rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    await AdminAuditLog.create({
      adminId: req.user.id,
      action: 'UPDATE_RESOURCE',
      resourceType: 'Resource',
      resourceId: resource._id,
      details: { updates: req.body },
      ipAddress: req.ip
    });

    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setSpotlight = async (req, res) => {
  try {
    const { resourceId } = req.body;
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    await DailySpotlight.findOneAndUpdate(
      { date: { $gte: startOfDay } },
      { resourceId, date: new Date(), isManual: true },
      { upsert: true, new: true }
    );

    await AdminAuditLog.create({
      adminId: req.user.id,
      action: 'SET_SPOTLIGHT',
      resourceType: 'DailySpotlight',
      resourceId,
      ipAddress: req.ip
    });

    res.json({ message: 'Spotlight set successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalResources = await Resource.countDocuments({ isPublished: true });
    const totalCompletions = await ResourceCompletion.countDocuments();
    const totalUpvotes = await ResourceUpvote.countDocuments();
    const totalReviews = await ResourceReview.countDocuments();
    const pendingSubmissions = await ResourceSubmission.countDocuments({ status: 'pending' });

    // Active students this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const activeCompleters = await ResourceCompletion.distinct('userId', { completedAt: { $gte: oneWeekAgo } });
    const activeUpvoters = await ResourceUpvote.distinct('userId', { createdAt: { $gte: oneWeekAgo } });
    const activeStudentsThisWeek = new Set([...activeCompleters.map(id => id.toString()), ...activeUpvoters.map(id => id.toString())]).size;

    // Top Resources
    const topResources = await Resource.aggregate([
      { $match: { isPublished: true } },
      { $lookup: { from: 'resourcecompletions', localField: '_id', foreignField: 'resourceId', as: 'completions' } },
      { $lookup: { from: 'resourceupvotes', localField: '_id', foreignField: 'resourceId', as: 'upvotes' } },
      { $lookup: { from: 'resourcereviews', localField: '_id', foreignField: 'resourceId', as: 'reviews' } },
      { $project: {
          id: '$_id',
          title: 1,
          category: 1,
          difficulty: 1,
          completions: { $size: '$completions' },
          upvotes: { $size: '$upvotes' },
          avgRating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $round: [{ $avg: '$reviews.rating' }, 1] },
              else: 0
            }
          }
      }},
      { $sort: { completions: -1, upvotes: -1 } },
      { $limit: 10 }
    ]);

    // Category Breakdown
    const categoryBreakdown = await Resource.aggregate([
      { $match: { isPublished: true } },
      { $lookup: { from: 'resourcecompletions', localField: '_id', foreignField: 'resourceId', as: 'completions' } },
      { $group: {
          _id: '$category',
          resourceCount: { $sum: 1 },
          completionCount: { $sum: { $size: '$completions' } }
      }},
      { $project: {
          category: '$_id',
          resourceCount: 1,
          completionCount: 1,
          completionRate: {
            $cond: {
              if: { $gt: ['$resourceCount', 0] },
              then: { $round: [{ $multiply: [{ $divide: ['$completionCount', '$resourceCount'] }, 100] }, 1] },
              else: 0
            }
          }
      }}
    ]);

    // Daily Completions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completionsData = await ResourceCompletion.aggregate([
      { $match: { completedAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Map to last 30 days array filling missing dates with 0
    const dailyCompletions = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = completionsData.find(c => c._id === dateStr);
      dailyCompletions.push({
        date: dateStr,
        count: found ? found.count : 0
      });
    }

    res.json({
      overview: {
        totalResources,
        totalCompletions,
        totalUpvotes,
        totalReviews,
        activeStudentsThisWeek,
        pendingSubmissions
      },
      topResources,
      categoryBreakdown,
      dailyCompletions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    
    // Also delete related docs
    await ResourceCompletion.deleteMany({ resourceId: req.params.id });
    await ResourceUpvote.deleteMany({ resourceId: req.params.id });
    await ResourceReview.deleteMany({ resourceId: req.params.id });
    
    await AdminAuditLog.create({
      adminId: req.user.id,
      action: 'DELETE_RESOURCE',
      resourceType: 'Resource',
      resourceId: req.params.id,
      details: { title: resource.title },
      ipAddress: req.ip
    });

    res.json({ message: 'Resource and related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
