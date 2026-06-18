const Resume = require('../models/Resume');
const ResumeVersion = require('../models/ResumeVersion');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const ResumeSection = require('../models/ResumeSection');
const Application = require('../models/Application');
const ResumePerformanceCache = require('../models/ResumePerformanceCache');
const fs = require('fs');
const path = require('path');
const { extractTextFromPDF, analyzeResumeWithAI, extractSectionsWithAI, compareResumesWithAI } = require('../services/resumeAiService');

// @desc    Get user resumes
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id, deletedAt: null }).sort({ lastUsedAt: -1, createdAt: -1 });
    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id, deletedAt: null });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const versions = await ResumeVersion.find({ resumeId: resume._id }).sort({ versionNumber: -1 });
    const analysis = await ResumeAnalysis.findOne({ resumeId: resume._id });
    const sections = await ResumeSection.find({ resumeId: resume._id }).sort({ orderIndex: 1 });

    res.status(200).json({
      resume,
      versions,
      analysis,
      sections
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Upload new resume
// @route   POST /api/resumes
// @access  Private
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const { versionTag, isPrimary, name, tags, notes, thumbnailUrl } = req.body;
    let parsedTags = [];
    if (tags) {
        try { parsedTags = JSON.parse(tags); } catch(e) { parsedTags = tags.split(','); }
    }

    const fullPath = path.join(__dirname, '../', \/uploads/resumes/\\);
    const { text, pageCount } = await extractTextFromPDF(fullPath);

    const resume = await Resume.create({
      user: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: \/uploads/resumes/\\,
      size: req.file.size,
      versionTag: versionTag || 'v1',
      isPrimary: isPrimary === 'true' || isPrimary === true,
      name: name || req.file.originalname.replace('.pdf', ''),
      tags: parsedTags,
      notes,
      thumbnailUrl,
      pageCount,
      version: 1
    });

    await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: 1,
      fileUrl: resume.filePath,
      changeNote: 'Initial upload'
    });

    // Fire off async analysis
    triggerAnalysisPipeline(resume._id, text);

    res.status(201).json(resume);
  } catch (error) {
    console.error("Resume Upload Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const uploadResumeVersion = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file' });
        
        const parentId = req.params.id;
        const parent = await Resume.findById(parentId);
        if (!parent || parent.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Resume not found' });

        const { changeNote, thumbnailUrl } = req.body;
        const newVersionNum = parent.version + 1;

        const fullPath = path.join(__dirname, '../', \/uploads/resumes/\\);
        const { text, pageCount } = await extractTextFromPDF(fullPath);

        const newResume = await Resume.create({
            user: req.user._id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: \/uploads/resumes/\\,
            size: req.file.size,
            versionTag: \\\,
            isPrimary: parent.isPrimary,
            name: parent.name,
            tags: parent.tags,
            notes: parent.notes,
            thumbnailUrl,
            pageCount,
            version: newVersionNum,
            parentResumeId: parentId,
            isActive: true
        });

        // Deactivate parent
        parent.isActive = false;
        await parent.save();

        await ResumeVersion.create({
            resumeId: newResume._id,
            versionNumber: newVersionNum,
            fileUrl: newResume.filePath,
            changeNote: changeNote || 'New version upload'
        });

        triggerAnalysisPipeline(newResume._id, text);
        res.status(201).json(newResume);
    } catch (error) {
        console.error("Resume Version Upload Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const triggerAnalysisPipeline = async (resumeId, text) => {
    try {
        const sectionsData = await extractSectionsWithAI(text);
        if (sectionsData && sectionsData.length) {
            for (let i = 0; i < sectionsData.length; i++) {
                await ResumeSection.create({
                    resumeId,
                    sectionType: sectionsData[i].type,
                    content: sectionsData[i].content,
                    orderIndex: i
                });
            }
        }

        const analysisData = await analyzeResumeWithAI(text);
        if (analysisData) {
            await ResumeAnalysis.create({
                resumeId,
                atsScore: analysisData.atsScore,
                wordCount: analysisData.wordCount,
                skillsDetected: analysisData.skillsDetected,
                missingCommonSkills: analysisData.missingCommonSkills,
                experienceYears: analysisData.experienceYears,
                educationDetected: analysisData.educationDetected,
                formattingIssues: analysisData.formattingIssues,
                keywordsFound: analysisData.keywordsFound,
                suggestions: analysisData.suggestions
            });
        }
    } catch (e) {
        console.error('Failed analysis pipeline for', resumeId, e);
    }
};

const analyzeResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Not found' });
        
        const fullPath = path.join(__dirname, '../', resume.filePath);
        const { text } = await extractTextFromPDF(fullPath);
        
        await ResumeSection.deleteMany({ resumeId: resume._id });
        await ResumeAnalysis.deleteMany({ resumeId: resume._id });
        
        await triggerAnalysisPipeline(resume._id, text);
        
        res.status(200).json({ message: 'Analysis complete' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update resume
// @route   PUT /api/resumes/:id
// @access  Private
const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (req.body.isPrimary && !resume.isPrimary) {
      await Resume.updateMany({ user: req.user._id }, { isPrimary: false });
    }

    const updatedResume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedResume);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const linkedApps = await Application.countDocuments({ resumeId: resume._id });
    if (linkedApps > 0 && !req.query.force) {
        return res.status(409).json({ message: 'Resume is linked to applications', count: linkedApps });
    }

    if (req.query.force) {
        await Application.updateMany({ resumeId: resume._id }, { "$set": { resumeId: null } });
    }

    resume.deletedAt = new Date();
    await resume.save();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getResumePerformance = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user._id;

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user.toString() !== userId.toString()) return res.status(401).json({ message: 'User not authorized' });

    // Check cache first (valid for 1 hour)
    const cache = await ResumePerformanceCache.findOne({ resumeId, userId });
    if (cache && (Date.now() - cache.lastCalculatedAt.getTime() < 3600000)) {
      return res.json(cache);
    }

    const applications = await Application.find({ userId, resumeId, isArchived: false, deletedAt: null });
    const totalApplications = applications.length;
    
    let shortlistedCount = 0;
    let rejectedCount = 0;
    let totalFitScore = 0;
    let rolesMap = {};
    let companiesMap = {};
    let sourcesMap = {};

    applications.forEach(app => {
      if (['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER'].includes(app.status)) shortlistedCount++;
      if (app.status === 'REJECTED') rejectedCount++;
      
      totalFitScore += app.fitScore || 0;

      rolesMap[app.role] = (rolesMap[app.role] || 0) + 1;
      companiesMap[app.company] = (companiesMap[app.company] || 0) + 1;
      sourcesMap[app.source] = (sourcesMap[app.source] || 0) + 1;
    });

    const averageFitScore = totalApplications > 0 ? Math.round(totalFitScore / totalApplications) : 0;

    const mapToTop = (map) => Object.keys(map).map(k => ({ name: k, count: map[k] })).sort((a, b) => b.count - a.count).slice(0, 3);

    const perfData = {
      resumeId,
      userId,
      totalApplications,
      shortlistedCount,
      rejectedCount,
      averageFitScore,
      topRoles: mapToTop(rolesMap).map(x => ({ role: x.name, count: x.count })),
      topCompanies: mapToTop(companiesMap).map(x => ({ company: x.name, count: x.count })),
      topSources: mapToTop(sourcesMap).map(x => ({ source: x.name, count: x.count })),
      lastCalculatedAt: new Date()
    };

    let savedCache;
    if (cache) {
      savedCache = await ResumePerformanceCache.findByIdAndUpdate(cache._id, perfData, { new: true });
    } else {
      savedCache = await ResumePerformanceCache.create(perfData);
    }

    res.json(savedCache);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getResumeStats = async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user._id, deletedAt: null });
        const versionsCount = await ResumeVersion.countDocuments({ resumeId: { "$in": resumes.map(r => r._id) } });
        
        let mostUsed = null;
        let bestPerforming = null;
        let maxApps = -1;
        let bestRate = -1;
        let totalAts = 0;
        let atsCount = 0;

        for (const r of resumes) {
            const perf = await ResumePerformanceCache.findOne({ resumeId: r._id });
            if (perf) {
                if (perf.totalApplications > maxApps) {
                    maxApps = perf.totalApplications;
                    mostUsed = r;
                }
                const rate = perf.totalApplications > 0 ? (perf.shortlistedCount / perf.totalApplications) : 0;
                if (rate > bestRate && perf.totalApplications >= 3) {
                    bestRate = rate;
                    bestPerforming = r;
                }
            }

            const analysis = await ResumeAnalysis.findOne({ resumeId: r._id });
            if (analysis && analysis.atsScore) {
                totalAts += analysis.atsScore;
                atsCount++;
            }
        }

        res.json({
            totalResumes: resumes.length,
            totalVersions: versionsCount,
            avgATSScore: atsCount > 0 ? Math.round(totalAts / atsCount) : 0,
            mostUsedResume: mostUsed ? { name: mostUsed.name || mostUsed.originalName, count: maxApps } : null,
            bestPerformingResume: bestPerforming ? { name: bestPerforming.name || bestPerforming.originalName, rate: bestRate } : null
        });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

const bulkTagResumes = async (req, res) => {
    try {
        const { ids, tag } = req.body;
        await Resume.updateMany(
            { _id: { "$in": ids }, user: req.user._id },
            { "$addToSet": { tags: tag } }
        );
        res.json({ message: 'Updated' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

const compareResumes = async (req, res) => {
    try {
        const r1 = await Resume.findById(req.params.id);
        const r2 = await Resume.findById(req.params.otherId);

        const t1 = await extractTextFromPDF(path.join(__dirname, '../', r1.filePath));
        const t2 = await extractTextFromPDF(path.join(__dirname, '../', r2.filePath));

        const summary = await compareResumesWithAI(t1.text, t2.text);

        res.json({
            summary,
            resume1: { name: r1.name || r1.originalName },
            resume2: { name: r2.name || r2.originalName }
        });
    } catch (e) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const previewResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
        if (!resume) return res.status(404).send('Not found');
        
        const fullPath = path.join(__dirname, '../', resume.filePath);
        if (!fs.existsSync(fullPath)) return res.status(404).send('File missing');

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', \inline; filename="\"\);
        fs.createReadStream(fullPath).pipe(res);
    } catch (e) {
        res.status(500).send('Error');
    }
};

module.exports = {
  getResumes,
  getResumeById,
  uploadResume,
  uploadResumeVersion,
  updateResume,
  deleteResume,
  getResumePerformance,
  getResumeStats,
  analyzeResume,
  bulkTagResumes,
  compareResumes,
  previewResume
};
