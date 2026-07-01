const express = require('express');
const router = express.Router();
const { handleWhatsAppMessage, handleWhatsAppStatus } = require('../controllers/botController');

// Standard webhook endpoint - usually public but secured via provider signatures (Twilio signature / Meta Verify Token)
router.post('/whatsapp', handleWhatsAppMessage);

// Status callback endpoint for read receipts and delivery statuses
router.post('/whatsapp/status', handleWhatsAppStatus);

module.exports = router;
