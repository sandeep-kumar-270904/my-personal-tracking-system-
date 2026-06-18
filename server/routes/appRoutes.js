const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  getApplicationById,
  getApplicationTimeline,
  getAppStats,
  bulkImport
} = require('../controllers/appController');

const {
  analyzeJD, matchResumeToJD, processEmailThread, analyzeRejection, getApplicationEmails
} = require('../controllers/applicationAIController');
const {
  shareApplications, exportPDF, getTemplates, createTemplate, updateTemplate, deleteTemplate
} = require('../controllers/applicationAddonsController');

const { recalculateMomentum, checkStatusSignals } = require('../controllers/v3CronController');
const { predictOutcome, predictionFeedback, negotiationSim, negotiationChat } = require('../controllers/v3IntelligenceController');
const { patchEffort, archiveApplication, getSuggestions, updateSuggestion, getWeeklyReviewData, saveWeeklyReview, getBattlePlan, saveBattlePlan, getAuditLogs, requestDataDeletion } = require('../controllers/v3TrackingController');

const { protect } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, getAppStats);
router.route('/bulk-import').post(protect, upload.single('file'), bulkImport);
router.route('/analyze-jd').post(protect, analyzeJD);
router.route('/match-resume').post(protect, matchResumeToJD);
router.route('/share').post(protect, shareApplications);
router.route('/export-pdf').get(protect, exportPDF);

// V3 Cron Routes (no protect to allow Vercel cron calls, or use a secret later)
router.route('/recalculate-momentum').post(recalculateMomentum);
router.route('/check-status-signals').post(checkStatusSignals);

// V3 Global Tracking Routes
router.route('/suggestions').get(protect, getSuggestions);
router.route('/suggestions/:id').put(protect, updateSuggestion);
router.route('/weekly-review').get(protect, getWeeklyReviewData).post(protect, saveWeeklyReview);
router.route('/battle-plan').get(protect, getBattlePlan).post(protect, saveBattlePlan);
router.route('/audit-logs').get(protect, getAuditLogs);
router.route('/request-data-deletion').post(protect, requestDataDeletion);

router.route('/templates')
  .get(protect, getTemplates)
  .post(protect, createTemplate);
router.route('/templates/:id')
  .put(protect, updateTemplate)
  .delete(protect, deleteTemplate);

router.route('/')
  .get(protect, getApplications)
  .post(protect, createApplication);

router.route('/:id/timeline')
  .get(protect, getApplicationTimeline);

router.route('/:id/email-thread')
  .get(protect, getApplicationEmails)
  .post(protect, processEmailThread);

router.route('/:id/rejection-analysis')
  .post(protect, analyzeRejection);

// V3 App-specific Routes
router.route('/:id/predict-outcome').post(protect, predictOutcome);
router.route('/:id/prediction-feedback').post(protect, predictionFeedback);
router.route('/:id/negotiation-sim').post(protect, negotiationSim);
router.route('/:id/negotiation-chat').post(protect, negotiationChat);
router.route('/:id/effort').patch(protect, patchEffort);
router.route('/:id/archive').put(protect, archiveApplication);

router.route('/:id')
  .get(protect, getApplicationById)
  .put(protect, updateApplication)
  .patch(protect, updateApplication)
  .delete(protect, deleteApplication);

module.exports = router;
