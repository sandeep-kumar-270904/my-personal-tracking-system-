const Goal = require('../models/Goal');
const Application = require('../models/Application');
const DSA = require('../models/DSA');
const Network = require('../models/Network');

// Get start of current week (Monday)
const getStartOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

// @desc    Get user goals and current weekly progress
// @route   GET /api/goals
// @access  Private
const getGoalsAndProgress = async (req, res) => {
  try {
    let goal = await Goal.findOne({ user: req.user.id });
    
    if (!goal) {
      goal = await Goal.create({ user: req.user.id });
    }

    const startOfWeek = getStartOfWeek();

    // Calculate current week's progress
    const applicationsCount = await Application.countDocuments({
      user: req.user.id,
      createdAt: { $gte: startOfWeek }
    });

    const dsaCount = await DSA.countDocuments({
      user: req.user.id,
      createdAt: { $gte: startOfWeek }
    });

    const networkCount = await Network.countDocuments({
      user: req.user.id,
      createdAt: { $gte: startOfWeek }
    });

    res.json({
      goal,
      progress: {
        applications: applicationsCount,
        dsa: dsaCount,
        networking: networkCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user goals
// @route   PUT /api/goals
// @access  Private
const updateGoals = async (req, res) => {
  try {
    const { applicationsTarget, dsaTarget, networkingTarget } = req.body;
    
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const diff = date.getDate() - date.getDay();
    const startOfWeek = new Date(date.setDate(diff));

    let goal = await Goal.findOne({ user: req.user.id, weekStartDate: { $lte: new Date(), $gte: startOfWeek } });
    
    if (!goal) {
      goal = await Goal.create({
        user: req.user.id,
        weekStartDate: startOfWeek,
        applicationsTarget: applicationsTarget || 10,
        dsaTarget: dsaTarget || 5,
        networkingTarget: networkingTarget || 3
      });
    } else {
      if (applicationsTarget !== undefined) goal.applicationsTarget = applicationsTarget;
      if (dsaTarget !== undefined) goal.dsaTarget = dsaTarget;
      if (networkingTarget !== undefined) goal.networkingTarget = networkingTarget;
      await goal.save();
    }

    res.json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getGoalsAndProgress,
  updateGoals
};
