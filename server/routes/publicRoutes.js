const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { getSharedApplications } = require('../controllers/applicationAddonsController');

router.get('/profile/:username', publicController.getPublicProfile);
router.get('/shared-applications/:token', getSharedApplications);
router.get('/calendar/:token', publicController.getSharedCalendar);
router.get('/offers/:token', publicController.getSharedOffers);
router.get('/booking/:token', publicController.getAvailableSlots);
router.post('/booking/:token', publicController.bookSlot);

module.exports = router;
