const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  getApplicationById,
  getApplicationTimeline,
  getAppStats,
  bulkImport
} = require('../controllers/appController');

const { protect } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, getAppStats);
router.route('/bulk-import').post(protect, upload.single('file'), bulkImport);

router.route('/')
  .get(protect, getApplications)
  .post(protect, createApplication);

router.route('/:id/timeline')
  .get(protect, getApplicationTimeline);

router.route('/:id')
  .get(protect, getApplicationById)
  .put(protect, updateApplication)
  .patch(protect, updateApplication)
  .delete(protect, deleteApplication);

module.exports = router;
