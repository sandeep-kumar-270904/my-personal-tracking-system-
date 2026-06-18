const User = require('../models/User');
const Application = require('../models/Application');
const DSA = require('../models/DSA');

exports.getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user || !user.isPublicProfile) {
      return res.status(404).json({ message: 'Profile not found or is private' });
    }

    const settings = user.publicProfileSettings || {};
    let profileData = {
      name: user.name,
      college: user.college,
      branch: user.branch,
      gradYear: user.gradYear,
      isOpenToOpportunities: settings.isOpenToOpportunities ?? true
    };

    // Gather Stats based on settings
    if (settings.showApplicationsCount !== false) {
      const appsCount = await Application.countDocuments({ userId: user._id });
      profileData.applicationsCount = appsCount;
    }

    if (settings.showTargetCompanies !== false && user.targetCompanies) {
      profileData.targetCompanies = user.targetCompanies;
    }

    if (settings.showDSAStats !== false) {
      const dsaCount = await DSA.countDocuments({ userId: user._id });
      profileData.dsaProblemsSolved = dsaCount;
    }

    // Need current streak. We can calculate simple streak from DSA solves or user model cache.
    if (settings.showStreak !== false) {
      // Calculate basic streak (for now, fetching recent DSA solves)
      const recentDSA = await DSA.find({ userId: user._id }).sort({ solvedAt: -1 }).select('solvedAt');
      let currentStreak = 0;
      
      if (recentDSA.length > 0) {
        let lastDate = new Date();
        lastDate.setHours(0,0,0,0);
        
        let solvedDates = [...new Set(recentDSA.map(d => {
          let date = new Date(d.solvedAt);
          date.setHours(0,0,0,0);
          return date.getTime();
        }))];

        let checkDate = lastDate.getTime();
        // Check if solved today or yesterday
        if (solvedDates.includes(checkDate) || solvedDates.includes(checkDate - 86400000)) {
          if (solvedDates.includes(checkDate)) {
             // they solved today, calculate streak
             let i = 0;
             while (solvedDates.includes(checkDate - (i * 86400000))) {
               currentStreak++;
               i++;
             }
          } else {
             // they solved yesterday, streak is active
             let i = 1;
             while (solvedDates.includes(checkDate - (i * 86400000))) {
               currentStreak++;
               i++;
             }
          }
        }
      }
      profileData.currentStreak = currentStreak;
    }

    res.json({ profile: profileData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching public profile' });
  }
};
