const Offer = require('../models/Offer');

// @desc    Get all offers for a user
// @route   GET /api/offers
// @access  Private
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ user: req.user.id }).sort('-createdAt');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private
const createOffer = async (req, res) => {
  try {
    const { company, role, baseSalary, signOnBonus, rsu, deadline, status, notes } = req.body;
    
    const offer = await Offer.create({
      user: req.user.id,
      company,
      role,
      baseSalary: Number(baseSalary),
      signOnBonus: Number(signOnBonus || 0),
      rsu: Number(rsu || 0),
      deadline,
      status,
      notes
    });

    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an offer
// @route   PUT /api/offers/:id
// @access  Private
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    res.json(updatedOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await offer.deleteOne();
    res.json({ message: 'Offer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer
};
