const express = require('express');
const router = express.Router();
const { getGoalsAndProgress, updateGoals } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getGoalsAndProgress)
  .put(protect, updateGoals);

module.exports = router;
