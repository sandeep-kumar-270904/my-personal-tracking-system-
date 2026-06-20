const express = require('express');
const router = express.Router();
const { handleWhatsAppMessage } = require('../controllers/botController');

// Standard webhook endpoint - usually public but secured via provider signatures (Twilio signature / Meta Verify Token)
router.post('/whatsapp', handleWhatsAppMessage);

module.exports = router;
