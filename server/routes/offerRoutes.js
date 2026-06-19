const express = require('express');
const router = express.Router();
const { getOffers, createOffer, updateOffer, deleteOffer, analyzeOfferLeverage } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getOffers)
  .post(protect, createOffer);

router.route('/:id')
  .put(protect, updateOffer)
  .delete(protect, deleteOffer);

router.post('/:id/resume-leverage', protect, analyzeOfferLeverage);

module.exports = router;
