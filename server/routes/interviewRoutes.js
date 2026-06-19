const express = require('express');
const router = express.Router();
const { 
  getInterviews, 
  createInterview, 
  updateInterview, 
  getInterviewById, 
  submitDebrief,
  getPrepBrief,
  getInterviewStats,
  getPatterns,
  analyzePatterns,
  getInsights,
  getQuestionBank,
  createMockSession,
  getUpcoming,
  getTimeline
} = require('../controllers/interviewIntelligenceController');
const { protect } = require('../middleware/authMiddleware');

const { extractResumeSignals } = require('../controllers/interviewController');

const {
  getStories, createStory,
  logCommunication, generateThankYouEmail,
  getOptimalState,
  generateInterviewerIntel,
  getSystemDesignTemplates, evaluateSystemDesignAttempt,
  generateNegotiationPrep,
  generateSynthesisReport, getSynthesisReports,
  syncLiveNotes,
  generatePrepSchedule
} = require('../controllers/interviewAddonsController');

router.use(protect);

// Action endpoints
router.post('/:id/extract-resume-signals', extractResumeSignals);
router.get('/stats', getInterviewStats);
router.get('/patterns', getPatterns);
router.get('/insights', getInsights);
router.get('/question-bank', getQuestionBank);
router.get('/upcoming', getUpcoming);
router.get('/timeline', getTimeline);
router.post('/analyze-patterns', analyzePatterns);
router.post('/mock', createMockSession);

// V2 Addons: Global routes
router.route('/stories')
  .get(getStories)
  .post(createStory);
router.get('/optimal-state', getOptimalState);
router.get('/system-design/templates', getSystemDesignTemplates);
router.post('/system-design/attempt', evaluateSystemDesignAttempt);
router.route('/synthesis')
  .get(getSynthesisReports)
  .post(generateSynthesisReport);

// Dynamic routes
router.route('/')
  .get(getInterviews)
  .post(createInterview);

router.route('/:id')
  .get(getInterviewById)
  .patch(updateInterview);

router.post('/:id/debrief', submitDebrief);
router.get('/:id/prep-brief', getPrepBrief);

// V2 Addons: Specific interview routes
router.post('/:id/communications', logCommunication);
router.post('/:id/communications/thank-you', generateThankYouEmail);
router.post('/:id/interviewer-intel', generateInterviewerIntel);
router.post('/:id/negotiation-prep', generateNegotiationPrep);
router.post('/:id/live-notes', syncLiveNotes);
router.post('/:id/generate-prep-schedule', generatePrepSchedule);

module.exports = router;
