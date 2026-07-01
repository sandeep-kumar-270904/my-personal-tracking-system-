const express = require('express');
const router = express.Router();
const {
  getResources,
  toggleUpvote,
  toggleComplete,
  toggleBookmark,
  getReviews,
  postReview,
  recommendResources,
  getSpotlight,
  submitResource,
  getMySubmissions,
  reportBrokenLink
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

// Must be before /:id routes
router.get('/recommend', protect, recommendResources);
router.get('/spotlight', protect, getSpotlight);
router.get('/submissions', protect, getMySubmissions);
router.post('/submit', protect, submitResource);

router.route('/')
  .get(protect, getResources);

router.post('/:id/upvote', protect, toggleUpvote);
router.post('/:id/complete', protect, toggleComplete);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/report-broken', protect, reportBrokenLink);

router.route('/:id/reviews')
  .get(protect, getReviews)
  .post(protect, postReview);

module.exports = router;
