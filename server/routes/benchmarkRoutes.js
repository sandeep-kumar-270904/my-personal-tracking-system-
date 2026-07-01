const express = require('express');
const router = express.Router();
const { getBenchmarks } = require('../controllers/benchmarkController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getBenchmarks);

module.exports = router;
