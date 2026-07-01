const express = require('express');
const router = express.Router();
const { getCriteria, createCriteria, deleteCriteria } = require('../controllers/offerCriteriaController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCriteria)
  .post(protect, createCriteria);

router.route('/:id')
  .delete(protect, deleteCriteria);

module.exports = router;
