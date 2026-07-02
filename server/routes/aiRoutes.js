const express = require('express');
const router = express.Router();
const { analyzeJD, matchResume, generateEmail, generateCoverLetter, evaluateMockAnswer, negotiateSalary, preflightResume } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze-jd', protect, analyzeJD);
router.post('/match-resume', protect, matchResume);
router.post('/generate-email', protect, generateEmail);
router.post('/generate-cover-letter', protect, generateCoverLetter);
router.post('/mock-interview-eval', protect, evaluateMockAnswer);
router.post('/negotiate', protect, negotiateSalary);
router.post('/preflight-resume', protect, preflightResume);

module.exports = router;
