const express = require('express');
const router = express.Router();
const { getCampusDrives, registerForDrive, updateParticipationStatus, createCampusDrive } = require('../controllers/campusDriveController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCampusDrives)
  .post(protect, createCampusDrive); // Usually admin, but leaving open for MVP

router.post('/:id/register', protect, registerForDrive);
router.put('/participation/:id', protect, updateParticipationStatus);

module.exports = router;
