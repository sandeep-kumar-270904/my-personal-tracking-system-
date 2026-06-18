const Application = require('../models/Application');
const ApplicationTimeline = require('../models/ApplicationTimeline');
const Interview = require('../models/Interview');
const { logTimelineEvent } = require('../services/timelineService');
const csv = require('csv-parser');
const fs = require('fs');

const getApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, source, priority, search, sortBy = 'dateApplied', sortOrder = 'desc' } = req.query;
    
    let query = { userId: req.user._id, deletedAt: null };

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

    res.json({
      applications,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
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

const createApplication = async (req, res) => {
  try {
    const { company, role, status = 'APPLIED', dateApplied = new Date(), resumeId, jobDescriptionUrl, source = 'ONLINE', priority = 'MEDIUM', notes, tags, link } = req.body;

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
      link
    });

    const createdApplication = await application.save();

    await logTimelineEvent(createdApplication._id, 'Application created', null, status, notes ? `Notes: ${notes}` : '');

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

    // Handle updates
    Object.keys(req.body).forEach(key => {
      if (key !== 'noteForTimeline') {
        application[key] = req.body[key];
      }
    });

    const updatedApplication = await application.save();

    if (status && status !== previousStatus) {
      await logTimelineEvent(application._id, `Status changed to ${status}`, previousStatus, status, noteForTimeline || '');
    } else if (noteForTimeline) {
       await logTimelineEvent(application._id, `Note added`, application.status, application.status, noteForTimeline);
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

    res.json({
      totalApplications: totalCount,
      byStatus: statusCounts,
      bySource: bySource.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
      shortlistRate: shortlistRate.toFixed(1),
      responseRate: responseRate.toFixed(1),
      avgDaysToResponse: 5, // placeholder, hard to calculate purely in mongo without complex timeline aggregation
      topCompanies
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

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationById,
  getApplicationTimeline,
  getAppStats,
  bulkImport
};
