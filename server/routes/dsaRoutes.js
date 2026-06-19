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

module.exports = router;
