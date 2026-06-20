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
    const user = await User.findOne({ 
      $or: [
        { 'calendarSettings.shareToken': token },
        { 'calendarSettings.shareLinks.token': token }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Shared calendar not found or link has been revoked.' });
    }

    let mode = 'full';
    let shareInterviewsOnly = user.calendarSettings?.shareInterviewsOnly;

    const linkMatch = user.calendarSettings?.shareLinks?.find(l => l.token === token);
    if (linkMatch) {
      mode = linkMatch.mode || 'full';
    }

    const query = { user: user._id, status: { $ne: 'cancelled' } };

    if (shareInterviewsOnly) {
      query.type = 'interview';
    }

    const events = await Event.find(query).sort({ date: 1, start_time: 1 });

    const publicEvents = events.map(e => ({
      _id: e._id,
      title: (mode === 'summary' && e.type !== 'interview' && !e.type.includes('deadline')) ? 'Busy' : e.title,
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

    let seasonSummary = null;
    if (mode === 'summary') {
      const Application = require('../models/Application');
      const Interview = require('../models/Interview');
      
      const applications = await Application.find({ userId: user._id });
      const uniqueCompanies = new Set(applications.map(app => app.company.toLowerCase()));
      const totalCompaniesApplied = uniqueCompanies.size;

      const interviews = await Interview.find({ userId: user._id });
      const offers = await Application.find({ userId: user._id, status: 'OFFER' });
      
      const successRate = interviews.length > 0 ? (offers.length / interviews.length) * 100 : 0;
      
      seasonSummary = {
        successRate: Math.round(successRate),
        totalCompaniesApplied,
        totalInterviews: interviews.length,
        offers: offers.length
      };
    }

    res.json({
      userName: user.name,
      mode,
      seasonSummary,
      events: publicEvents
    });
  } catch (error) {
    console.error('Error fetching shared calendar:', error);
    res.status(500).json({ message: 'Server error fetching shared calendar' });
  }
};

const Notification = require('../models/Notification');

// Recruiter Booking Logic
const DEFAULT_DURATIONS = { interview: 60, event: 60, follow_up: 30, deadline: 0 };

function getOffsetMinutes(timezone, utcDate) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(utcDate);
    const map = {};
    parts.forEach(p => map[p.type] = p.value);
    
    const localInUTC = Date.UTC(
      parseInt(map.year),
      parseInt(map.month) - 1,
      parseInt(map.day),
      parseInt(map.hour) === 24 ? 0 : parseInt(map.hour),
      parseInt(map.minute),
      parseInt(map.second)
    );
    return Math.round((localInUTC - utcDate.getTime()) / 60000);
  } catch (err) {
    return 0;
  }
}

function localTimeToUTC(dateStr, timeStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '00:00').split(':').map(Number);
  
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  for (let i = 0; i < 3; i++) {
    const dateVal = new Date(utcMs);
    const offsetMinutes = getOffsetMinutes(timezone, dateVal);
    utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0) - offsetMinutes * 60000;
  }
  return new Date(utcMs);
}

function utcToLocalTime(utcDate, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(utcDate);
    const map = {};
    parts.forEach(p => map[p.type] = p.value);
    
    const hour = map.hour === '24' ? '00' : map.hour;
    return {
      dateStr: `${map.year}-${map.month}-${map.day}`,
      timeStr: `${hour}:${map.minute}`
    };
  } catch (err) {
    const pad = (n) => String(n).padStart(2, '0');
    return {
      dateStr: `${utcDate.getUTCFullYear()}-${pad(utcDate.getUTCMonth() + 1)}-${pad(utcDate.getUTCDate())}`,
      timeStr: `${pad(utcDate.getUTCHours())}:${pad(utcDate.getUTCMinutes())}`
    };
  }
}

exports.getAvailableSlots = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ 'calendarSettings.recruiterLinks.token': token });

    if (!user) {
      return res.status(404).json({ message: 'Booking link not found or expired.' });
    }

    const linkData = user.calendarSettings.recruiterLinks.find(l => l.token === token);
    const now = new Date();
    if (new Date(linkData.endDate) < now) {
      return res.status(400).json({ message: 'Booking link expired.' });
    }

    const userTimezone = user.calendarSettings?.timezone || 'Asia/Kolkata';
    const dur = linkData.duration || 60;

    // Use link date window or fallback to next 7 days
    const start = new Date(linkData.startDate);
    const end = new Date(linkData.endDate);

    const events = await Event.find({
      user: user._id,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    });

    const freeSlots = [];
    let currentDay = new Date(start);
    currentDay.setUTCHours(0,0,0,0);

    const endLimit = new Date(end);
    endLimit.setUTCHours(23,59,59,999);

    // Provide up to 10 slots to pick from
    while (currentDay <= endLimit && freeSlots.length < 10) {
      const dateStr = currentDay.toISOString().split('T')[0];

      let slotTime = localTimeToUTC(dateStr, '09:00', userTimezone);
      const dayEnd = localTimeToUTC(dateStr, '18:00', userTimezone);

      while (slotTime.getTime() + dur * 60000 <= dayEnd.getTime() && freeSlots.length < 10) {
        const slotEnd = new Date(slotTime.getTime() + dur * 60000);
        if (slotTime < now) {
          slotTime.setTime(slotTime.getTime() + 30 * 60000);
          continue;
        }
        
        let hasConflict = false;
        for (const event of events) {
          if (event.is_all_day) continue;
          
          const evStart = new Date(event.date);
          if (event.start_time) {
            const [h, m] = event.start_time.split(':').map(Number);
            evStart.setUTCHours(h, m, 0, 0);
          }
          
          const evDuration = event.end_time ? 0 : (DEFAULT_DURATIONS[event.type] || 60);
          const evEnd = new Date(evStart.getTime());
          if (event.end_time) {
            const [h, m] = event.end_time.split(':').map(Number);
            evEnd.setUTCHours(h, m, 0, 0);
          } else {
            evEnd.setTime(evEnd.getTime() + evDuration * 60000);
          }

          if (slotTime < evEnd && evStart < slotEnd) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          const startInfo = utcToLocalTime(slotTime, userTimezone);
          const endInfo = utcToLocalTime(slotEnd, userTimezone);

          freeSlots.push({
            date: slotTime,
            start: slotTime.toISOString(),
            end: slotEnd.toISOString(),
            start_time: startInfo.timeStr,
            end_time: endInfo.timeStr,
            duration: dur
          });
        }

        slotTime.setTime(slotTime.getTime() + 30 * 60000);
      }
      currentDay.setUTCDate(currentDay.getUTCDate() + 1);
    }

    res.json({ userName: user.name, slots: freeSlots, duration: dur });
  } catch (error) {
    console.error('Error finding free slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { token } = req.params;
    const { date, start_time, end_time, duration, recruiterName, company, email } = req.body;

    const user = await User.findOne({ 'calendarSettings.recruiterLinks.token': token });
    if (!user) {
      return res.status(404).json({ message: 'Booking link not found or expired.' });
    }

    // Transactional slot-claim logic (MongoDB optimistic concurrency / direct creation)
    // To prevent double booking, we check for conflict immediately before inserting.
    // In MongoDB without full transactions, we can just check and insert (acceptable for low volume).
    const startUtcDate = new Date(date);
    
    // Check conflicts one last time
    const [sh, sm] = start_time.split(':').map(Number);
    const checkStart = new Date(startUtcDate);
    checkStart.setUTCHours(sh, sm, 0, 0);
    const checkEnd = new Date(checkStart.getTime() + duration * 60000);

    const existingEvents = await Event.find({
      user: user._id,
      date: startUtcDate,
      status: { $ne: 'cancelled' }
    });

    for (const event of existingEvents) {
      if (event.is_all_day) continue;
      const evStart = new Date(event.date);
      if (event.start_time) {
        const [eh, em] = event.start_time.split(':').map(Number);
        evStart.setUTCHours(eh, em, 0, 0);
      }
      const evDuration = event.end_time ? 0 : (DEFAULT_DURATIONS[event.type] || 60);
      const evEnd = new Date(evStart.getTime() + evDuration * 60000);

      if (checkStart < evEnd && evStart < checkEnd) {
        return res.status(409).json({ message: 'This slot was just booked. Please choose another.' });
      }
    }

    // Create Event
    const newEvent = new Event({
      user: user._id,
      title: `Interview with ${company} (${recruiterName})`,
      date: startUtcDate,
      start_time,
      end_time,
      type: 'interview',
      status: 'upcoming',
      description: `Booked by: ${recruiterName} (${email})\nCompany: ${company}`,
      source: 'auto_interview'
    });

    await newEvent.save();

    // Create notification for user
    await Notification.create({
      userId: user._id,
      type: 'SYSTEM',
      title: 'New Interview Scheduled',
      message: `${recruiterName} from ${company} booked an interview on ${startUtcDate.toISOString().split('T')[0]} at ${start_time}.`,
      read: false
    });

    res.json({ message: 'Slot successfully booked!' });
  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
