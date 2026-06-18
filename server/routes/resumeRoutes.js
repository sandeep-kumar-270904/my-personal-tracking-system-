const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
  getResumes, 
  uploadResume, 
  updateResume, 
  deleteResume, 
  getResumePerformance,
  getResumeStats,
  getResumeById,
  analyzeResume,
  compareResumes,
  previewResume,
  bulkTagResumes,
  uploadResumeVersion
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

router.route('/')
  .get(protect, getResumes)
  .post(protect, upload.single('resume'), uploadResume);

router.post('/bulk-tag', protect, bulkTagResumes);
router.get('/stats', protect, getResumeStats);

router.route('/:id')
  .get(protect, getResumeById)
  .put(protect, updateResume)
  .delete(protect, deleteResume);

router.post('/:id/upload-version', protect, upload.single('resume'), uploadResumeVersion);
router.post('/:id/analyze', protect, analyzeResume);
router.get('/:id/compare/:otherId', protect, compareResumes);
router.get('/:id/preview', protect, previewResume);
router.get('/:id/performance', protect, getResumePerformance);

module.exports = router;
