const express = require('express');
const router = express.Router();

const { getSyllabuses, generateSyllabus, getAlerts } = require('../controllers/prepHubController');
const { protect } = require('../middleware/authMiddleware');

router.get('/syllabus', protect, getSyllabuses);
router.post('/generate/:appId', protect, generateSyllabus);
router.get('/alerts', protect, getAlerts);

module.exports = router;
