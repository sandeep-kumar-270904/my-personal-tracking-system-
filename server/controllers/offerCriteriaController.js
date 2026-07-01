const OfferCriteria = require('../models/OfferCriteria');

// @desc    Get user's offer criteria
// @route   GET /api/offer-criteria
// @access  Private
const getCriteria = async (req, res) => {
  try {
    const criteria = await OfferCriteria.find({ user_id: req.user.id });
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new offer criteria
// @route   POST /api/offer-criteria
// @access  Private
const createCriteria = async (req, res) => {
  try {
    const { criteria_name, criteria_type, target_value } = req.body;
    const criteria = await OfferCriteria.create({
      user_id: req.user.id,
      criteria_name,
      criteria_type,
      target_value
    });
    res.status(201).json(criteria);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an offer criteria
// @route   DELETE /api/offer-criteria/:id
// @access  Private
const deleteCriteria = async (req, res) => {
  try {
    const criteria = await OfferCriteria.findById(req.params.id);
    if (!criteria) {
      return res.status(404).json({ message: 'Criteria not found' });
    }
    if (criteria.user_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await criteria.deleteOne();
    res.json({ message: 'Criteria removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCriteria,
  createCriteria,
  deleteCriteria
};
