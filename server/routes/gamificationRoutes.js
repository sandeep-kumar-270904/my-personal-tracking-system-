const express = require('express');
const router = express.Router();
const { getStreak, getBadges, getLeaderboard } = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

const apiRouter = express.Router();

apiRouter.get('/streak', protect, getStreak);
apiRouter.get('/badges', protect, getBadges);
apiRouter.get('/leaderboard', protect, getLeaderboard);

module.exports = apiRouter;
