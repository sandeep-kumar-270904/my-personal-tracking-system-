const express = require('express');
const router = express.Router();
const { getOffers, createOffer, updateOffer, deleteOffer } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getOffers)
  .post(protect, createOffer);

router.route('/:id')
  .put(protect, updateOffer)
  .delete(protect, deleteOffer);

module.exports = router;
