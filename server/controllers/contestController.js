const { recordGoalProgress } = require('../services/goalTrackingService');
const Contest = require('../models/Contest');

// @desc    Log contest participation
// @route   POST /api/contests/participate
exports.logContestParticipation = async (req, res) => {
  try {
    const { name, site, url } = req.body;
    
    // Check if we have a contest model matching this, else just use the name
    let contest = await Contest.findOne({ name, userId: req.user._id });
    if (!contest) {
      contest = await Contest.create({
        userId: req.user._id,
        name,
        platform: site || 'OTHER',
        url,
        startsAt: new Date(),
        status: 'COMPLETED'
      });
    } else {
      contest.status = 'COMPLETED';
      await contest.save();
    }

    await recordGoalProgress(req.user._id, 'contests', 1, contest._id);
    res.json({ message: 'Contest participation logged successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
