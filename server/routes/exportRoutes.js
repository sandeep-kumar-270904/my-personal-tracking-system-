const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/json', protect, exportController.exportJson);
router.get('/csv', protect, exportController.exportCsv);
router.get('/pdf', protect, exportController.exportPdf);
router.get('/md', protect, exportController.exportMd);
router.post('/import-csv', protect, upload.single('file'), exportController.importCsv);

module.exports = router;
