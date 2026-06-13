const Network = require('../models/Network');

// @desc    Get all network contacts
// @route   GET /api/network
// @access  Private
const getContacts = async (req, res) => {
  try {
    const contacts = await Network.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a new contact
// @route   POST /api/network
// @access  Private
const addContact = async (req, res) => {
  try {
    const { name, company, role, platform, status, lastContactDate, notes } = req.body;
    
    const contact = new Network({
      user: req.user.id,
      name,
      company,
      role,
      platform,
      status,
      lastContactDate,
      notes
    });

    const savedContact = await contact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a contact
// @route   PUT /api/network/:id
// @access  Private
const updateContact = async (req, res) => {
  try {
    const contact = await Network.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedContact = await Network.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a contact
// @route   DELETE /api/network/:id
// @access  Private
const deleteContact = async (req, res) => {
  try {
    const contact = await Network.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await contact.deleteOne();
    res.json({ message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact
};
