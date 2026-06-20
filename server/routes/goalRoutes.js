const express = require('express');
const router = express.Router();
const {
  getGoalsOverview,
  createGoal,
  updateGoal,
  deleteGoal,
  addManualProgress,
  undoProgress,
  getGoalInsights,
  getGoalSuggestions,
  addSnapshotFeedback,
  createShareLink,
  getSharedGoals,
  archiveActiveGoals
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/shared/:token', getSharedGoals);

router.use(protect);

router.post('/share', createShareLink);

router.route('/')
  .get(getGoalsOverview)
  .post(createGoal);

router.put('/archive-active', archiveActiveGoals);

router.route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

router.post('/:id/progress', addManualProgress);
router.delete('/progress/:entryId', undoProgress);

router.get('/:id/insights', getGoalInsights);
router.get('/:id/suggestions', getGoalSuggestions);
router.post('/snapshots/:id/feedback', addSnapshotFeedback);

module.exports = router;
