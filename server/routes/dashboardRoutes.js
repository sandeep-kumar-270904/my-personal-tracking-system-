const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getDashboardPipeline, 
  getDashboardActivityFeed, 
  getDashboardUpcoming, 
  getDashboardHeatmap, 
  getDashboardCharts,
  getAIInsights,
  getReadinessScore,
  completeOnboarding
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, getDashboardStats);
router.route('/pipeline').get(protect, getDashboardPipeline);
router.route('/activity-feed').get(protect, getDashboardActivityFeed);
router.route('/upcoming').get(protect, getDashboardUpcoming);
router.route('/heatmap').get(protect, getDashboardHeatmap);
router.route('/charts').get(protect, getDashboardCharts);
router.route('/ai-insights').get(protect, getAIInsights);
router.route('/readiness-score').get(protect, getReadinessScore);
router.route('/onboard').post(protect, completeOnboarding);

module.exports = router;
