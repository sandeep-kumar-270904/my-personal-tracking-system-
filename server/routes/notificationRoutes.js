const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, handleNotificationAction } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.post('/:id/action', protect, handleNotificationAction);

module.exports = router;
