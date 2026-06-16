const express = require('express');
const { analyzeJD, matchResume } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze-jd', protect, analyzeJD);
router.post('/match-resume', protect, matchResume);

module.exports = router;
