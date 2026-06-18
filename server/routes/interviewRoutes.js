const express = require('express');
const router = express.Router();
const { getInterviews, createInterview, updateInterview, deleteInterview, generatePrepBrief } = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getInterviews).post(protect, createInterview);
router.route('/:id').put(protect, updateInterview).delete(protect, deleteInterview);
router.post('/:id/prep-brief', protect, generatePrepBrief);

module.exports = router;
