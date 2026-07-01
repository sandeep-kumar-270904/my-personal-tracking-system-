const express = require('express');
const router = express.Router();
const { getCollections, getCollectionById, enrollCollection } = require('../controllers/collectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCollections);
router.get('/:id', getCollectionById);
router.post('/:id/enroll', enrollCollection);

module.exports = router;
