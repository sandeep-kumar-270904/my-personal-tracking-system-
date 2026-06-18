const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/lookup', protect, companyController.lookupCompanies);
router.get('/:name/intel', protect, companyController.getCompanyIntel);

module.exports = router;
