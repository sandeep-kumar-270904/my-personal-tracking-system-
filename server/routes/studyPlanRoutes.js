const express = require('express');
const router = express.Router();
const { generatePlan, getMyPlan, completeTask, deletePlan } = require('../controllers/studyPlanController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate', generatePlan);
router.get('/my-plan', getMyPlan);
router.patch('/:planId/week/:weekNumber/task/:taskId', completeTask);
router.delete('/:planId', deletePlan);

module.exports = router;
