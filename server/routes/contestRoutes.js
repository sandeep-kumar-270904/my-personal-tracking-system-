const express = require('express');
const router = express.Router();
const { logContestParticipation } = require('../controllers/contestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/participate', protect, logContestParticipation);

module.exports = router;
