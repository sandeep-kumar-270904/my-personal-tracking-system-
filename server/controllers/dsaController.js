const DSA = require('../models/DSA');

// @desc    Get user DSA progress
// @route   GET /api/dsa
// @access  Private
const getDSAs = async (req, res) => {
  try {
    const dsas = await DSA.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(dsas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create new DSA topic
// @route   POST /api/dsa
// @access  Private
const createDSA = async (req, res) => {
  const { topic, problemsSolved, difficulty, status, url, notes } = req.body;

  try {
    const dsa = await DSA.create({
      userId: req.user._id,
      topic,
      problemsSolved: problemsSolved || 0,
      difficulty: difficulty || 'Medium',
      status: status || 'Not Started',
      url: url || '',
      notes,
    });

    res.status(201).json(dsa);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update DSA progress
// @route   PUT /api/dsa/:id
// @access  Private
const updateDSA = async (req, res) => {
  try {
    const dsa = await DSA.findById(req.params.id);

    if (!dsa) {
      return res.status(404).json({ message: 'DSA topic not found' });
    }

    if (dsa.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedDSA = await DSA.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedDSA);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete DSA topic
// @route   DELETE /api/dsa/:id
// @access  Private
const deleteDSA = async (req, res) => {
  try {
    const dsa = await DSA.findById(req.params.id);

    if (!dsa) {
      return res.status(404).json({ message: 'DSA topic not found' });
    }

    if (dsa.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await dsa.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDSAs,
  createDSA,
  updateDSA,
  deleteDSA,
};
