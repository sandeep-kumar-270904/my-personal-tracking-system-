const express = require('express');
const router = express.Router();
const { chatWithResource } = require('../controllers/resourceChatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/:resourceId', chatWithResource);

module.exports = router;
