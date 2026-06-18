const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getDashboardPipeline, 
  getDashboardActivityFeed, 
  getDashboardUpcoming, 
  getDashboardHeatmap, 
  getDashboardCharts 
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, getDashboardStats);
router.route('/pipeline').get(protect, getDashboardPipeline);
router.route('/activity-feed').get(protect, getDashboardActivityFeed);
router.route('/upcoming').get(protect, getDashboardUpcoming);
router.route('/heatmap').get(protect, getDashboardHeatmap);
router.route('/charts').get(protect, getDashboardCharts);

module.exports = router;
