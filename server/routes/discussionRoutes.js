const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const discussionController = require('../controllers/discussionController');

router.get('/resource/:resourceId', protect, discussionController.getComments);
router.post('/resource/:resourceId', protect, discussionController.postComment);
router.post('/:commentId/like', protect, discussionController.likeComment);
router.delete('/:commentId/like', protect, discussionController.unlikeComment);

module.exports = router;
