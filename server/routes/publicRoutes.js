const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/profile/:username', publicController.getPublicProfile);

module.exports = router;
