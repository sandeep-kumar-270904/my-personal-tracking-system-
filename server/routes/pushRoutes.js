const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, pushController.subscribe);
router.get('/vapidPublicKey', protect, pushController.getVapidPublicKey);

module.exports = router;
