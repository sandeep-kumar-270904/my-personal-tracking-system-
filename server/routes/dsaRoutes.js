const express = require('express');
const router = express.Router();
const { getDSAs, createDSA, updateDSA, deleteDSA } = require('../controllers/dsaController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getDSAs).post(protect, createDSA);
router.route('/:id').put(protect, updateDSA).delete(protect, deleteDSA);

module.exports = router;
