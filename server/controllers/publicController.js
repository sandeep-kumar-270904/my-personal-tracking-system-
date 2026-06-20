const User = require('../models/User');
const Application = require('../models/Application');
const DSA = require('../models/DSA');
const Event = require('../models/Event');

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

exports.getSharedCalendar = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ 'calendarSettings.shareToken': token });

    if (!user || !user.calendarSettings?.shareToken) {
      return res.status(404).json({ message: 'Shared calendar not found or link has been revoked.' });
    }

    const query = { user: user._id, status: { $ne: 'cancelled' } };

    if (user.calendarSettings.shareInterviewsOnly) {
      query.type = 'interview';
    }

    const events = await Event.find(query).sort({ date: 1, start_time: 1 });

    const publicEvents = events.map(e => ({
      _id: e._id,
      title: e.title,
      date: e.date,
      start_time: e.start_time,
      end_time: e.end_time,
      is_all_day: e.is_all_day,
      type: e.type,
      status: e.status,
      end_date: e.end_date,
      is_recurring: e.is_recurring,
      recurrence_pattern: e.recurrence_pattern
    }));

    res.json({
      userName: user.name,
      events: publicEvents
    });
  } catch (error) {
    console.error('Error fetching shared calendar:', error);
    res.status(500).json({ message: 'Server error fetching shared calendar' });
  }
};
