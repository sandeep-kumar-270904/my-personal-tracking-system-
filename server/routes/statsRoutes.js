const express = require('express');
const router = express.Router();
const { getMyStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyStats);

module.exports = router;
