const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/lookup', protect, companyController.lookupCompanies);

module.exports = router;
