const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
  getResumes, 
  uploadResume, 
  updateResume, 
  deleteResume, 
  getResumePerformance,
  getResumeStats,
  getResumeById,
  analyzeResume,
  compareResumes,
  previewResume,
  bulkTagResumes,
  uploadResumeVersion,
  copyResume
} = require('../controllers/resumeController');
const {
  rewriteSectionStream,
  acceptRewrite,
  getRewriteHistory,
  tailorResume,
  generateCoverLetterStream,
  getCoverLetters,
  analyzeKeywords,
  fixKeywordStream,
  importLinkedIn,
  healthCheck,
  getHealthAlerts,
  resolveHealthAlert,
  predictInterviewQuestions,
  createABTest,
  getABTests,
  saveBuiltResume,
  scoreJD,
  batchScoreJD,
  getJDScores,
  getPeerBenchmark,
  runMaintenanceWizard,
  getImpactEvents,
  addImpactEvent,
  updateImpactEvent,
  generateReviewLink,
  getReviewByToken,
  addFeedback,
  getPublicFeedbacks,
  getFeedback,
  resolveFeedback,
  generateIntelligenceReport,
  getCheckpoints,
  restoreCheckpoint,
  syncDSASkills,
  getPendingDSASyncs,
  acceptDSASync,
  dismissDSASync,
  getInterviewSignals,
  processOutcomeLearning,
  getOutcomeLearning,
  getPrepHubGaps
} = require('../controllers/resumeAddonsController');
const { protect } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

router.route('/')
  .get(protect, getResumes)
  .post(protect, upload.single('resume'), uploadResume);

// Addons R5: LinkedIn Import
router.post('/import-linkedin', protect, upload.single('resume'), importLinkedIn);

// Addons R6: Health Monitor
router.post('/health-check', protect, healthCheck);
router.get('/health-alerts', protect, getHealthAlerts);
router.put('/health-alerts/:alertId/resolve', protect, resolveHealthAlert);

// Addons R7: Interview Predictor
router.post('/:id/predicted-questions', protect, predictInterviewQuestions);

// Addons R8: AB Tests
router.route('/ab-tests')
  .post(protect, createABTest)
  .get(protect, getABTests);

// Addons R9: Smart Resume Builder
router.post('/builder/save', protect, saveBuiltResume);

// Addons R10 & R11: JD Scoring
router.post('/:id/jd-score', protect, scoreJD);
router.post('/:id/batch-jd-score', protect, batchScoreJD);
router.get('/:id/jd-scores', protect, getJDScores);

// Addons R12: Peer Benchmarking
router.get('/:id/benchmark', protect, getPeerBenchmark);

// Addons R13: Decay Prevention System
router.post('/:id/maintenance-wizard', protect, runMaintenanceWizard);

// Addons R14: Impact Tracker
router.get('/:id/impact-events', protect, getImpactEvents);
router.post('/:id/impact-events', protect, addImpactEvent);
router.put('/:id/impact-events/:eventId', protect, updateImpactEvent);

// Addons R15: Collaborative Resume Review
router.post('/:id/review-link', protect, generateReviewLink);
router.get('/review/:token', getReviewByToken); // Public
router.post('/review/:token/feedback', addFeedback); // Public
router.get('/review/:token/feedbacks', getPublicFeedbacks); // Public
router.get('/:id/feedback', protect, getFeedback);
router.put('/:id/feedback/:feedbackId/resolve', protect, resolveFeedback);

// Addons R16: Intelligence Report
router.post('/:id/intelligence-report', protect, generateIntelligenceReport);

// Addons R17: Time Machine
router.get('/:id/checkpoints', protect, getCheckpoints);
router.post('/:id/restore/:checkpointId', protect, restoreCheckpoint);

// Addons V4 RX1: DSA Skill Sync
router.post('/sync-dsa-skills', syncDSASkills); // Internal hook route
router.get('/dsa-sync-suggestions', protect, getPendingDSASyncs);
router.post('/dsa-sync-suggestions/:id/accept', protect, acceptDSASync);
router.post('/dsa-sync-suggestions/:id/dismiss', protect, dismissDSASync);

// Addons V4 RX2: Interview Feedback Loop
router.get('/:id/interview-signals', protect, getInterviewSignals);

// Addons V4 RX3: Application Outcome Learning
router.post('/:id/outcome-learning/process', processOutcomeLearning);
router.get('/:id/outcome-learning', protect, getOutcomeLearning);
router.get('/:id/prephub-gaps', protect, getPrepHubGaps);

router.post('/bulk-tag', protect, bulkTagResumes);
router.get('/stats', protect, getResumeStats);
router.get('/cover-letters', protect, getCoverLetters);
router.post('/:id/copy', protect, copyResume);

router.route('/:id')
  .get(protect, getResumeById)
  .put(protect, updateResume)
  .delete(protect, deleteResume);

router.post('/:id/upload-version', protect, upload.single('resume'), uploadResumeVersion);
router.post('/:id/analyze', protect, analyzeResume);
router.get('/:id/compare/:otherId', protect, compareResumes);
router.get('/:id/preview', protect, previewResume);
router.get('/:id/performance', protect, getResumePerformance);

// Addons R1: AI Rewrite
router.post('/:id/sections/:sectionId/rewrite', protect, rewriteSectionStream);
router.post('/:id/sections/:sectionId/rewrite/accept', protect, acceptRewrite);
router.get('/:id/sections/:sectionId/rewrites', protect, getRewriteHistory);

// Addons R2: Tailoring
router.post('/:id/tailor', protect, tailorResume);

// Addons R3: Cover Letter
router.post('/:id/cover-letter', protect, generateCoverLetterStream);

// Addons R4: Keyword Match
router.post('/:id/keyword-match', protect, analyzeKeywords);
router.post('/:id/sections/:sectionId/keywords/fix', protect, fixKeywordStream);

module.exports = router;
