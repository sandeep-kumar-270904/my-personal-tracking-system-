const express = require('express');
const router = express.Router();
const {
  getOverview,
  logProblem,
  getProblems,
  updateProblem,
  getStreak,
  getSpacedRepetitionQueue,
  reviewProblem,
  getWeaknessAnalysis,
  getRecommendations,
  getHeatmap,
  getActiveSession,
  startSession,
  endSession,
  getCompanyPatterns,
  getProgressReport
} = require('../controllers/dsaController');

const {
  syncLeetCode,
  syncGFG,
  syncLeetCodeScheduled,
  getAdaptiveDifficulty,
  detectPatterns,
  getBenchmarks,
  getKnowledgeGraph,
  getTimeAnalytics,
  getReadinessAssessment,
  evaluateMockInterview
} = require('../controllers/dsaV2Controller');

const {
  analyzeBehavior,
  analyzeContestPerformance,
  getTrajectory,
  createStudyGroup,
  joinStudyGroup,
  getStudyGroupLeaderboard,
  getStudyGroupActivity,
  getDifficultyCalibration,
  logMistake,
  getMistakePatterns,
  calculateDecay,
  extractDSASignals,
  generateCurriculum,
  getCurriculum,
  recalibrateCurriculum
} = require('../controllers/dsaV3Controller');

const {
  extractResumeSignals,
  activateInterviewPrepMode,
  getApplicationIntelligence,
  generatePreContestBrief,
  scheduleStudyBlocks,
  extractNetworkingSignals,
  processPrepHubCompletion,
  getCommandCenterData
} = require('../controllers/dsaV4Controller');

const {
  submitDiagnostic,
  getConceptModules,
  getConceptModuleById,
  completeConceptModule,
  logThinkingVelocity,
  getThinkingVelocityTrend,
  logBlindImplementation,
  submitORCA,
  evaluateRubberDuck,
  evaluateSolutionQuality,
  checkCalibrationEligible,
  startCalibration,
  submitCalibration,
  submitStuckProtocol,
  startPressureMode,
  submitPressureMode,
  getPressureGap,
  getNextPatternDisguise,
  submitPatternDisguise,
  getPatternRecognitionAccuracy,
  getDailyBrief,
  completeDailyBriefTask,
  getAvoidanceLocks,
  checkAvoidanceUnlock,
  getActiveRecallDue,
  submitActiveRecallAnswer,
  getWeeklyHonestReport,
  getPlacementSentence,
  getCompanyReadiness,
  activateInterviewEve
} = require('../controllers/dsaV5Controller');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', getOverview);
router.post('/problems', logProblem);
router.get('/problems', getProblems);
router.patch('/problems/:id', updateProblem);
router.post('/problems/:id/review', reviewProblem);

router.get('/streak', getStreak);
router.get('/spaced-repetition', getSpacedRepetitionQueue);
router.get('/weakness-analysis', getWeaknessAnalysis);
router.get('/recommendations', getRecommendations);
router.get('/heatmap', getHeatmap);

router.get('/study-session/active', getActiveSession);
router.post('/study-session/start', startSession);
router.post('/study-session/end', endSession);

router.get('/company-patterns', getCompanyPatterns);
router.get('/progress-report', getProgressReport);

// --- V2 Addons ---
router.post('/sync/leetcode', syncLeetCode);
router.post('/sync/gfg', syncGFG);
router.post('/sync/leetcode/scheduled', syncLeetCodeScheduled); // Might be protected or not depending on cron setup, leaving protected for now or we can create an unprotected cron route
router.get('/adaptive-difficulty', getAdaptiveDifficulty);
router.post('/problems/:id/detect-patterns', detectPatterns);
router.get('/benchmarks', getBenchmarks);
router.get('/knowledge-graph', getKnowledgeGraph);
router.get('/time-analytics', getTimeAnalytics);
router.post('/readiness-assessment', getReadinessAssessment);
router.post('/mock-interview/evaluate', evaluateMockInterview);

// --- V3 Addons ---
router.post('/analyze-behavior', analyzeBehavior);
router.post('/contests/:contestId/analyze-performance', analyzeContestPerformance);
router.get('/trajectory', getTrajectory);
router.post('/groups/create', createStudyGroup);
router.post('/groups/join', joinStudyGroup);
router.get('/groups/:id/leaderboard', getStudyGroupLeaderboard);
router.get('/groups/:id/activity', getStudyGroupActivity);
router.get('/difficulty-calibration', getDifficultyCalibration);
router.post('/mistakes', logMistake);
router.get('/mistake-patterns', getMistakePatterns);
router.post('/calculate-decay', calculateDecay);
router.post('/interviews/:id/extract-dsa-signals', extractDSASignals);
router.post('/generate-curriculum', generateCurriculum);
router.get('/curriculum', getCurriculum);
router.post('/curriculum/recalibrate', recalibrateCurriculum);

// --- V4 Addons ---
router.post('/signals/from-resume-jd', extractResumeSignals);
router.post('/interviews/:id/activate-prep-mode', activateInterviewPrepMode);
router.get('/application-intelligence', getApplicationIntelligence);
router.post('/contests/:id/pre-contest-brief', generatePreContestBrief);
router.post('/schedule-study-blocks', scheduleStudyBlocks);
router.post('/signals/from-contact', extractNetworkingSignals);
router.post('/signals/from-prephub', processPrepHubCompletion);
router.get('/command-center', getCommandCenterData);

// --- V5 Addons ---
router.post('/diagnostic', submitDiagnostic);
router.get('/concept-modules', getConceptModules);
router.get('/concept-modules/:id', getConceptModuleById);
router.post('/concept-modules/:id/complete', completeConceptModule);
router.post('/problems/:id/thinking-velocity', logThinkingVelocity);
router.get('/thinking-velocity', getThinkingVelocityTrend);
router.post('/problems/:id/blind-implementation', logBlindImplementation);
router.post('/problems/:id/orca', submitORCA);
router.post('/problems/:id/rubber-duck', evaluateRubberDuck);
router.post('/problems/:id/solution-quality', evaluateSolutionQuality);
router.get('/calibration/eligible', checkCalibrationEligible);
router.post('/calibration/start', startCalibration);
router.post('/calibration/submit', submitCalibration);
router.post('/problems/:id/stuck-protocol', submitStuckProtocol);
router.post('/pressure-mode/start', startPressureMode);
router.post('/pressure-mode/submit', submitPressureMode);
router.get('/pressure-gap', getPressureGap);
router.get('/pattern-disguise/next', getNextPatternDisguise);
router.post('/pattern-disguise/submit', submitPatternDisguise);
router.get('/pattern-recognition-accuracy', getPatternRecognitionAccuracy);
router.get('/daily-brief', getDailyBrief);
router.post('/daily-brief/complete-task', completeDailyBriefTask);
router.get('/avoidance-locks', getAvoidanceLocks);
router.post('/avoidance-locks/check-unlock', checkAvoidanceUnlock);
router.get('/active-recall/due', getActiveRecallDue);
router.post('/active-recall/:noteId/answer', submitActiveRecallAnswer);
router.get('/weekly-honest-report', getWeeklyHonestReport);
router.get('/placement-sentence', getPlacementSentence);
router.get('/company-readiness/:companyName', getCompanyReadiness);
router.post('/interview-eve/activate', activateInterviewEve);

module.exports = router;
