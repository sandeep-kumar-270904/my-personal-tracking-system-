const express = require('express');
const router = express.Router();
const { createDriveBroadcast } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'placement_cell_admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

router.use(protect);
router.use(adminOnly);

router.post('/broadcasts', createDriveBroadcast);

module.exports = router;
