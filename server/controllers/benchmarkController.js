const AggregatedStats = require('../models/AggregatedStats');
const Application = require('../models/Application');
const DSA = require('../models/DSA');
const Interview = require('../models/Interview');
const User = require('../models/User');

// @desc    Get user's benchmarking data compared to their cohort
// @route   GET /api/benchmarks
// @access  Private
const getBenchmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.gradYear) {
      return res.status(400).json({ message: 'Graduation year required for benchmarking' });
    }

    if (!user.benchmarkOptIn) {
      return res.status(403).json({ message: 'You must opt-in to benchmarking to view cohort data.' });
    }

    // Get today's date and set to 00:00:00 to match cron job
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to get today's stats, or fallback to most recent
    let aggregatedStats = await AggregatedStats.findOne({ cohortYear: user.gradYear })
      .sort({ date: -1 });

    if (!aggregatedStats) {
      return res.status(404).json({ message: 'No benchmarking data available yet for your cohort' });
    }

    // Minimum participants check removed for development/testing
    // if (aggregatedStats.totalUsersSampled < 20) {
    //   return res.status(403).json({ message: 'Not enough data yet. Benchmarking requires a minimum of 20 participating students in your cohort to protect privacy.' });
    // }

    // Calculate user's current stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const apps = await Application.countDocuments({
      userId: req.user._id,
      appliedDate: { $gte: startOfMonth }
    });

    const dsaProgress = await DSA.findOne({ user: req.user._id });
    const userDSASolved = dsaProgress ? dsaProgress.solvedProblems.length : 0;

    const interviews = await Interview.find({ userId: req.user._id });
    let totalInterviews = interviews.length;
    let selectedInterviews = interviews.filter(i => i.status === 'Offer' || i.status === 'Done').length;
    const userConversion = totalInterviews > 0 ? (selectedInterviews / totalInterviews) * 100 : 0;

    const response = {
      userStats: {
        applicationsThisMonth: apps,
        dsaSolved: userDSASolved,
        interviewConversion: Math.round(userConversion * 10) / 10
      },
      cohortStats: {
        year: user.gradYear,
        avgApplications: aggregatedStats.avgApplications,
        avgDSASolved: aggregatedStats.avgDSASolved,
        avgInterviewConversion: aggregatedStats.avgInterviewConversion,
        totalUsersSampled: aggregatedStats.totalUsersSampled
      },
      deltas: {
        applications: Math.round((apps - aggregatedStats.avgApplications) * 10) / 10,
        dsaSolved: Math.round((userDSASolved - aggregatedStats.avgDSASolved) * 10) / 10,
        interviewConversion: Math.round((userConversion - aggregatedStats.avgInterviewConversion) * 10) / 10
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch benchmarking data' });
  }
};

module.exports = {
  getBenchmarks
};
