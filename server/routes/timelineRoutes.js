const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const timelineController = require('../controllers/timelineController');

router.get('/unified', protect, timelineController.getUnifiedTimeline);
router.get('/export-pdf', protect, timelineController.exportJourneyPDF);

module.exports = router;
