const express = require('express');
const router = express.Router();
const { analyzeJD, matchResume, generateEmail } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze-jd', protect, analyzeJD);
router.post('/match-resume', protect, matchResume);
router.post('/generate-email', protect, generateEmail);

module.exports = router;
