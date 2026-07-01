const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getOffers, createOffer, updateOffer, deleteOffer, analyzeOfferLeverage, uploadDocument, addNegotiationLog, generateDeclineDraft, getBenchmarks, addPostAcceptanceTask, updatePostAcceptanceTask, generateThankYouDraft, extractDocument } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads/offers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'offer-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/benchmarks', protect, getBenchmarks);

router.route('/')
  .get(protect, getOffers)
  .post(protect, createOffer);

router.route('/:id')
  .put(protect, updateOffer)
  .delete(protect, deleteOffer);

router.post('/:id/resume-leverage', protect, analyzeOfferLeverage);
router.post('/:id/upload-document', protect, upload.single('document'), uploadDocument);
router.post('/:id/negotiation-log', protect, addNegotiationLog);
router.post('/:id/decline-draft', protect, generateDeclineDraft);
router.post('/:id/thank-you-draft', protect, generateThankYouDraft);
router.post('/:id/tasks', protect, addPostAcceptanceTask);
router.put('/:id/tasks/:taskId', protect, updatePostAcceptanceTask);
router.post('/extract-document', protect, upload.single('document'), extractDocument);

module.exports = router;
