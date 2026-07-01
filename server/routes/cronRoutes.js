const express = require('express');
const router = express.Router();
const { autoSelectSpotlight, sendWeeklyDigest, checkLinkRot } = require('../controllers/cronController');

// Using a simple secret header or internal network for cron protection in production
router.post('/spotlight', autoSelectSpotlight);
router.post('/weekly-digest', sendWeeklyDigest);
router.post('/link-rot', checkLinkRot);

module.exports = router;
