const express = require('express');
const router = express.Router();
const { serveSecureDocument, generateSignedUrl } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

// Route to generate a temporary pre-signed URL for browser viewing/downloading
router.post('/sign-url', protect, generateSignedUrl);

// Secure authenticated streaming route (supports Bearer JWT header or ?token= query parameter)
router.get('/:type/:filename', serveSecureDocument);

module.exports = router;
