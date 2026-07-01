const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const socialController = require('../controllers/socialController');

router.post('/follow/:studentId', protect, socialController.followStudent);
router.post('/unfollow/:studentId', protect, socialController.unfollowStudent);
router.get('/feed', protect, socialController.getActivityFeed);
router.get('/profile/:studentId', protect, socialController.getProfileData);

module.exports = router;
