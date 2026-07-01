const express = require('express');
const router = express.Router();
const { getContacts, addContact, updateContact, deleteContact, getNetworkGraph, searchContacts } = require('../controllers/networkController');
const { protect } = require('../middleware/authMiddleware');

router.route('/graph')
  .get(protect, getNetworkGraph);

router.route('/search')
  .get(protect, searchContacts);

router.route('/')
  .get(protect, getContacts)
  .post(protect, addContact);

router.route('/:id')
  .put(protect, updateContact)
  .delete(protect, deleteContact);

module.exports = router;
