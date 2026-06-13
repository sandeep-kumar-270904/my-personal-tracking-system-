const express = require('express');
const router = express.Router();
const { getResumes, createResume, updateResume, deleteResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getResumes).post(protect, createResume);
router.route('/:id').put(protect, updateResume).delete(protect, deleteResume);

module.exports = router;
