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

const {
  getPsychologyProfile, updatePsychologyProfile,
  getCompanyProcesses, aggregateCompanyProcesses,
  getAnswerFrameworks,
  getOutcomePrediction,
  getEnergyForecast,
  analyzeRejection,
  getCertifications, evaluateCertifications,
  saveSimulationSession, getSimulations, chatSimulation,
  generatePortfolio
} = require('../controllers/interviewV3Controller');

const {
  resumeSignalAmplification,
  getApplicationContext,
  getNetworkingContext,
  offerSignalCheck,
  getCalendarIntelligence,
  extractResourceNeeds,
  intelligenceLoop,
  getCommandCenter
} = require('../controllers/interviewV4Controller');

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

// V3 Addons: Global routes
router.get('/psychology-profile', getPsychologyProfile);
router.post('/update-psychology-profile', updatePsychologyProfile);
router.get('/company-processes', getCompanyProcesses);
router.post('/aggregate-company-processes', aggregateCompanyProcesses);
router.get('/answer-frameworks', getAnswerFrameworks);
router.get('/energy-forecast', getEnergyForecast);
router.get('/certifications', getCertifications);
router.post('/evaluate-certifications', evaluateCertifications);
router.route('/simulations')
  .get(getSimulations)
  .post(saveSimulationSession);
router.post('/simulations/chat', chatSimulation);
router.post('/generate-portfolio', generatePortfolio);

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

// V3 Addons: Specific interview routes
router.get('/:id/outcome-prediction', getOutcomePrediction);
router.post('/:id/rejection-analysis', analyzeRejection);

// V4 Addons: Global routes
router.post('/v4/resume-signal-amplification', resumeSignalAmplification);
router.post('/v4/offer-signal-check', offerSignalCheck);
router.get('/v4/calendar-intelligence', getCalendarIntelligence);
router.post('/v4/extract-resource-needs', extractResourceNeeds);
router.get('/v4/command-center', getCommandCenter);
router.get('/application-context/:applicationId', getApplicationContext);

const {
  evalOpeningRitual, evalTalkWhileCoding, evalStuckRecovery,
  getQuestionBank: getV5QuestionBank, addQuestionToBank, logSkillCalibration, updateSkillCalibration,
  evalFollowUpDepth, logTimeAllocation, evalStoryNaturalness,
  startColdSimulation, answerColdSimulation, evalWrongAnswerRecovery,
  getSignalVocabulary, evalDetailCalibration, getPreInterviewProtocol, generatePreInterviewProtocol,
  getMemoryCaptureQuestions, submitMemoryCapture, getPerformanceDashboard
} = require('../controllers/interviewV5Controller');

// V4 Addons: Specific interview routes
router.post('/v4/intelligence-loop/:id', intelligenceLoop);
router.post('/:id/networking-context', getNetworkingContext);

// V5: Training Mechanics Routes
router.post('/training/opening-ritual', evalOpeningRitual);
router.post('/training/talk-while-coding', evalTalkWhileCoding);
router.post('/training/stuck-recovery', evalStuckRecovery);
router.route('/training/question-bank').get(getV5QuestionBank).post(addQuestionToBank);
router.post('/training/skill-calibration', logSkillCalibration);
router.patch('/training/skill-calibration/:interviewId', updateSkillCalibration);
router.post('/training/follow-up-depth', evalFollowUpDepth);
router.post('/training/time-allocation', logTimeAllocation);
router.post('/training/story-naturalness', evalStoryNaturalness);
router.post('/training/cold-simulation', startColdSimulation);
router.post('/training/cold-simulation/:sessionId/answer', answerColdSimulation);
router.post('/training/wrong-answer-recovery', evalWrongAnswerRecovery);
router.get('/training/signal-vocabulary', getSignalVocabulary);
router.post('/training/detail-calibration', evalDetailCalibration);
router.get('/training/pre-interview-protocol', getPreInterviewProtocol);
router.post('/training/pre-interview-protocol/generate', generatePreInterviewProtocol);
router.post('/training/memory-capture', getMemoryCaptureQuestions);
router.post('/training/memory-capture/:interviewId/submit', submitMemoryCapture);
router.get('/training/performance-dashboard', getPerformanceDashboard);

module.exports = router;
