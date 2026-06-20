const PlacementDriveBroadcast = require('../models/PlacementDriveBroadcast');

// @desc    Create a new placement drive broadcast
// @route   POST /api/admin/broadcasts
// @access  Private (Admin only)
exports.createDriveBroadcast = async (req, res) => {
  try {
    const { companyName, roles, eligibleBranches, description, deadline, applyLink } = req.body;

    const broadcast = await PlacementDriveBroadcast.create({
      companyName,
      roles: roles ? roles.split(',').map(r => r.trim()) : [],
      eligibleBranches: eligibleBranches ? eligibleBranches.split(',').map(b => b.trim()) : [],
      description,
      deadline,
      applyLink,
      createdBy: req.user.id
    });

    res.status(201).json(broadcast);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
