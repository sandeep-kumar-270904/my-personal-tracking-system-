const express = require('express');
const router = express.Router();
const { getCompanyInsights } = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/insights', protect, getCompanyInsights);

module.exports = router;
