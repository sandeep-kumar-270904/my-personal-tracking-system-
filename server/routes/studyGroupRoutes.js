const express = require('express');
const router = express.Router();
const { 
  createGroup, 
  joinGroup, 
  getMyGroups, 
  getGroupDetails, 
  createWeeklyChallenge, 
  completeChallenge 
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/', getMyGroups);
router.get('/:id', getGroupDetails);
router.post('/:id/challenge', createWeeklyChallenge);
router.post('/:id/challenge/:challengeId/complete', completeChallenge);

module.exports = router;
