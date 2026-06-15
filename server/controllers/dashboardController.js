const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Offer = require('../models/Offer');
const DSA = require('../models/DSA');
const Goal = require('../models/Goal');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate counts
    const totalApplications = await Application.countDocuments({ user: userId });
    const activeInterviews = await Interview.countDocuments({ user: userId, status: 'Upcoming' });
    const offersReceived = await Offer.countDocuments({ user: userId });
    const dsaTopicsTracked = await DSA.countDocuments({ user: userId });

    res.status(200).json({
      totalApplications,
      activeInterviews,
      offersReceived,
      dsaTopicsTracked,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
