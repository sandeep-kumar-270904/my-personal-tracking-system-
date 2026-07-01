const express = require('express');
const router = express.Router();
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

const { 
  createDriveBroadcast, 
  getSubmissions, 
  approveSubmission, 
  rejectSubmission, 
  setSpotlight,
  getAnalytics,
  updateResource,
  deleteResource
} = require('../controllers/adminController');

const {
  getAdminCollections,
  createCollection,
  updateCollection,
  updateCollectionItems,
  deleteCollection
} = require('../controllers/collectionController');

router.post('/broadcasts', createDriveBroadcast);

// Resource Management Admin Routes
router.get('/resources/submissions', getSubmissions);
router.post('/resources/submissions/:id/approve', approveSubmission);
router.post('/resources/submissions/:id/reject', rejectSubmission);
router.post('/resources/spotlight', setSpotlight);
router.get('/resources/analytics', getAnalytics);
router.put('/resources/:id', updateResource);
router.delete('/resources/:id', deleteResource);

// Collection Management Admin Routes
router.get('/collections', getAdminCollections);
router.post('/collections', createCollection);
router.patch('/collections/:id', updateCollection);
router.put('/collections/:id/items', updateCollectionItems);
router.delete('/collections/:id', deleteCollection);

module.exports = router;
