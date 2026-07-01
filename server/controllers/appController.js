const Application = require('../models/Application');
const { syncEventFromSource, removeEventForSource } = require('../utils/calendarSync');
const ApplicationTimeline = require('../models/ApplicationTimeline');
const Interview = require('../models/Interview');
const { logTimelineEvent } = require('../services/timelineService');
const csv = require('csv-parser');
const fs = require('fs');
const { recordGoalProgress, removeGoalProgress } = require('../services/goalTrackingService');
const Resume = require('../models/Resume');
const prepHubSyncService = require('../services/prepHubSyncService');

const getApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, source, priority, search, sortBy = 'dateApplied', sortOrder = 'desc', isArchived = 'false', isDead = 'false' } = req.query;
    
    let query = { userId: req.user._id, deletedAt: null };

    // V3: Archive filter
    if (isArchived === 'true') {
      query.isArchived = true;
    } else {
      query.isArchived = false;
    }

    // V3: Dead filter
    if (isDead === 'true') {
      query.momentumScore = { $lt: 20 };
    }

    // V5: No Network filter
    if (req.query.noNetwork === 'true') {
      const Network = require('../models/Network');
      const contacts = await Network.find({ userId: req.user._id, isDeleted: false }).select('company');
      const companiesWithContacts = [...new Set(contacts.map(c => c.company))];
      query.company = { $nin: companiesWithContacts };
    }

    if (status && status !== 'All') {
      const statusArray = status.split(',');
      query.status = { $in: statusArray };
    }
    if (source && source !== 'All') {
      const sourceArray = source.split(',');
      query.source = { $in: sourceArray };
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const applications = await Application.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('resumeId', 'name');

    const totalCount = await Application.countDocuments(query);

    const terminalCount = await Application.countDocuments({ userId: req.user._id, status: { $in: ['OFFER', 'REJECTED'] }, deletedAt: null });
    const hasEnoughDataForPrediction = terminalCount >= 10;

    const Network = require('../models/Network');

    // Attach networking data
    const appCompanies = applications.map(a => a.company);
    const networkContacts = await Network.find({
      userId: req.user._id,
      company: { $in: appCompanies },
      isDeleted: false
    });

    const applicationsWithNetworking = applications.map(app => {
      const companyContacts = networkContacts.filter(c => c.company === app.company);
      const referralContact = companyContacts.find(c => ['ASKED', 'AGREED', 'SUBMITTED'].includes(c.referralStatus));
      
      return {
        ...app.toObject(),
        network: {
          contactCount: companyContacts.length,
          hasReferralBoost: !!referralContact,
          referralStatus: referralContact ? referralContact.referralStatus : null
        }
      };
    });

    res.json({
      applications: applicationsWithNetworking,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      hasEnoughDataForPrediction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
      .populate('resumeId', 'name');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const timeline = await ApplicationTimeline.find({ applicationId: application._id }).sort({ createdAt: -1 });
    const interviews = await Interview.find({ applicationId: application._id, userId: req.user._id }).sort({ date: 1 });

    res.json({
      ...application.toObject(),
      timeline,
      interviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationTimeline = async (req, res) => {
  try {
    const timeline = await ApplicationTimeline.find({ applicationId: req.params.id }).sort({ createdAt: -1 });
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { calculateFitScore } = require('../services/fitScoreService');

// Levenshtein distance helper
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }
  return matrix[a.length][b.length];
};

const createApplication = async (req, res) => {
  try {
    const { company, role, status = 'APPLIED', dateApplied = new Date(), resumeId, jobDescriptionUrl, source = 'ONLINE', priority = 'MEDIUM', notes, tags, link, ignoreDuplicate, deadline } = req.body;

    // A4: Duplicate detection
    if (!ignoreDuplicate) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const recentApps = await Application.find({ 
        userId: req.user._id, 
        deletedAt: null,
        createdAt: { $gte: ninetyDaysAgo }
      });
      
      const duplicate = recentApps.find(app => {
        const compDist = levenshtein(app.company.toLowerCase(), company.toLowerCase());
        const roleDist = levenshtein(app.role.toLowerCase(), role.toLowerCase());
        return compDist < 3 && roleDist < 3;
      });

      if (duplicate) {
        return res.status(200).json({ isDuplicate: true, existingApp: duplicate });
      }
    }

    const application = new Application({
      userId: req.user._id,
      company,
      role,
      status,
      dateApplied,
      resumeId: resumeId || null,
      jobDescriptionUrl,
      source,
      priority,
      notes,
      tags,
      link,
      deadline
    });

    const createdApplication = await application.save();

    await recordGoalProgress(req.user._id, 'applications', 1, createdApplication._id);
    
    // v5 Resume Tailoring Auto-Tracking
    if (resumeId) {
      const resumeUsed = await Resume.findById(resumeId);
      if (resumeUsed && !resumeUsed.isPrimary) {
        await recordGoalProgress(req.user._id, 'resume_tailoring', 1, createdApplication._id);
      }
    }

    await syncEventFromSource('application', createdApplication);

    await logTimelineEvent(createdApplication._id, 'Application created', null, status, notes ? `Notes: ${notes}` : '');

    // A1: Calculate Fit Score in background
    calculateFitScore(createdApplication).then(async ({ score, breakdown }) => {
       createdApplication.fitScore = score;
       createdApplication.fitScoreBreakdown = breakdown;
       await createdApplication.save();
    });

    // Cross-page sync
    prepHubSyncService.onApplicationAdded(req.user._id, createdApplication._id).catch(console.error);

    res.status(201).json(createdApplication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const previousStatus = application.status;
    const { status, noteForTimeline } = req.body;

    let roleOrCompanyChanged = false;
    // Handle updates
    Object.keys(req.body).forEach(key => {
      if (key !== 'noteForTimeline') {
        if ((key === 'role' || key === 'company') && application[key] !== req.body[key]) {
          roleOrCompanyChanged = true;
        }
        application[key] = req.body[key];
      }
    });

    const updatedApplication = await application.save();

    await syncEventFromSource('application', updatedApplication);

    if (status && status !== previousStatus) {
      await logTimelineEvent(application._id, `Status changed to ${status}`, previousStatus, status, noteForTimeline || '');
      
      // C2: Auto-generate Prep Syllabus on INTERVIEW_SCHEDULED
      if (status === 'INTERVIEW_SCHEDULED') {
        const { generateSyllabusInternal } = require('./prepHubController');
        generateSyllabusInternal(application._id, application.userId).catch(err => {
          console.error("Failed to auto-generate prep syllabus:", err);
        });
      }
    } else if (noteForTimeline) {
       await logTimelineEvent(application._id, `Note added`, application.status, application.status, noteForTimeline);
    }

    // A1: Recalculate fit score if role or company changed
    if (roleOrCompanyChanged) {
      calculateFitScore(updatedApplication).then(async ({ score, breakdown }) => {
         updatedApplication.fitScore = score;
         updatedApplication.fitScoreBreakdown = breakdown;
         await updatedApplication.save();
      });
    }

    res.json(updatedApplication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.deletedAt = new Date();
    await application.save();
    
    await removeGoalProgress(req.user._id, 'applications', application._id);
    await removeEventForSource('application', req.params.id);
    
    await logTimelineEvent(application._id, 'Application deleted', application.status, 'DELETED');

    res.json({ message: 'Application removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAppStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const matchStage = { $match: { userId, deletedAt: null } };

    const totalCount = await Application.countDocuments({ userId, deletedAt: null });

    const byStatus = await Application.aggregate([
      matchStage,
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const bySource = await Application.aggregate([
      matchStage,
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    const statusCounts = byStatus.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const totalApplied = totalCount;
    let shortlistRate = 0;
    let responseRate = 0;

    if (totalApplied > 0) {
      const shortlistedCount = (statusCounts['INTERVIEW_SCHEDULED'] || 0) + (statusCounts['SHORTLISTED'] || 0) + (statusCounts['OFFER'] || 0);
      shortlistRate = (shortlistedCount / totalApplied) * 100;
      
      const respondedCount = totalApplied - (statusCounts['APPLIED'] || 0) - (statusCounts['OA_PENDING'] || 0); 
      // Anyone who got OA_DONE, INTERVIEW, SHORTLISTED, REJECTED, OFFER got a response. Wait, OA_PENDING might be a response? Let's say APPLIED is no response.
      const noResponseCount = statusCounts['APPLIED'] || 0;
      responseRate = ((totalApplied - noResponseCount) / totalApplied) * 100;
    }

    // Top companies
    const topCompanies = await Application.aggregate([
      matchStage,
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const effortAgg = await Application.aggregate([
      matchStage,
      { $group: { _id: null, totalEffort: { $sum: '$effortMinutes' } } }
    ]);
    const totalEffortMinutes = effortAgg[0]?.totalEffort || 0;

    res.json({
      totalApplications: totalCount,
      byStatus: statusCounts,
      bySource: bySource.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
      shortlistRate: shortlistRate.toFixed(1),
      responseRate: responseRate.toFixed(1),
      avgDaysToResponse: 5, // placeholder
      topCompanies,
      totalEffortMinutes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let rowCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        rowCount++;
        if (!data.company || !data.role) {
          errors.push({ row: rowCount, reason: 'Company and Role are required' });
        } else {
          results.push(data);
        }
      })
      .on('end', async () => {
        let insertedCount = 0;
        
        for (const row of results) {
          try {
             const app = new Application({
               userId: req.user._id,
               company: row.company,
               role: row.role,
               status: row.status || 'APPLIED',
               dateApplied: row.dateApplied ? new Date(row.dateApplied) : new Date(),
               source: row.source || 'ONLINE',
               notes: row.notes || ''
             });
             await app.save();
             await logTimelineEvent(app._id, 'Application imported', null, app.status, '');
             insertedCount++;
          } catch(e) {
             errors.push({ row: 'unknown', reason: e.message });
          }
        }
        
        // Clean up file
        fs.unlinkSync(req.file.path);

        res.json({
          insertedCount,
          errors
        });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationRoi = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id });
    const sourceStats = {};

    applications.forEach(app => {
      const source = app.source || 'Other';
      if (!sourceStats[source]) {
        sourceStats[source] = { total: 0, interviewScheduled: 0, rejectedGhosted: 0 };
      }
      sourceStats[source].total += 1;

      if (['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_RECEIVED', 'ACCEPTED'].includes(app.status)) {
        sourceStats[source].interviewScheduled += 1;
      } else if (['REJECTED', 'GHOSTED'].includes(app.status)) {
        sourceStats[source].rejectedGhosted += 1;
      }
    });

    const roiData = Object.keys(sourceStats).map(source => {
      const stats = sourceStats[source];
      const roiPercent = stats.total > 0 ? ((stats.interviewScheduled / stats.total) * 100).toFixed(1) : 0;
      return {
        source,
        total: stats.total,
        roiPercent: Number(roiPercent),
        interviewScheduled: stats.interviewScheduled,
        rejectedGhosted: stats.rejectedGhosted
      };
    }).sort((a, b) => b.roiPercent - a.roiPercent);

    res.json(roiData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationById,
  getApplicationTimeline,
  getAppStats,
  bulkImport,
  getApplicationRoi
};
