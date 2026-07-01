const cron = require('node-cron');
const { sendEmail } = require('./email');
const Event = require('../models/Event');
const Interview = require('../models/Interview');
const Network = require('../models/Network');
const User = require('../models/User');
const Goal = require('../models/Goal');
const GoalProgressEntry = require('../models/GoalProgressEntry');
const GoalPeriodSnapshot = require('../models/GoalPeriodSnapshot');

const startCronJobs = () => {
  // Run everyday at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('Running daily reminder check...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

      // We'll collect all reminders grouped by User ID
      const userReminders = {};

      const addUserReminder = (userId, message) => {
        if (!userReminders[userId]) userReminders[userId] = [];
        userReminders[userId].push(message);
      };

      // 1. Check Events
      const events = await Event.find({
        date: { $gte: today, $lt: dayAfterTomorrow },
        emailReminder: true
      });
      events.forEach(event => {
        addUserReminder(event.user.toString(), `Event: ${event.title} is scheduled for ${event.date.toDateString()}`);
      });

      // 2. Check Interviews
      const interviews = await Interview.find({
        interviewDate: { $gte: today, $lt: dayAfterTomorrow }
      });
      interviews.forEach(interview => {
        addUserReminder(interview.userId.toString(), `Interview: You have an interview with ${interview.company} on ${interview.interviewDate.toDateString()}`);
      });

      // 3. Check Network Follow-ups
      const networkFollowUps = await Network.find({
        followUpDate: { $gte: today, $lt: dayAfterTomorrow }
      });
      networkFollowUps.forEach(contact => {
        addUserReminder(contact.user.toString(), `Follow-up: Reach out to ${contact.name} at ${contact.company} on ${contact.followUpDate.toDateString()}`);
      });

      // Create Notifications for Interviews (next 3 days)
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      const Notification = require('../models/Notification');
      const Application = require('../models/Application');
      const DSA = require('../models/DSA');

      const upcomingInterviews = await Interview.find({
        scheduledAt: { $gte: today, $lte: threeDaysFromNow }
      });
      for (const interview of upcomingInterviews) {
        await Notification.create({
          userId: interview.userId,
          title: 'Upcoming Interview',
          message: `You have an interview with ${interview.company} on ${new Date(interview.scheduledAt).toDateString()}. Generate an AI Prep Brief!`,
          type: 'INTERVIEW'
        });
      }

      // Applications stuck in Applied for > 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const staleApplications = await Application.find({
        status: 'Applied',
        updatedAt: { $lte: fourteenDaysAgo }
      });
      for (const app of staleApplications) {
        await Notification.create({
          userId: app.userId,
          title: 'Follow Up Reminder',
          message: `Your application at ${app.company} has been in 'Applied' state for over 14 days. Consider reaching out.`,
          type: 'APPLICATION_STALE'
        });
      }

      // DSA Streak reminder
      // Just check if today they haven't solved anything and they have an active streak > 0
      const users = await User.find({});
      for (const user of users) {
        const dsaProgress = await DSA.findOne({ user: user._id });
        if (dsaProgress) {
          // Check if solved today
          const solvedToday = dsaProgress.solvedProblems.some(p => {
            const date = new Date(p.dateSolved);
            return date >= today;
          });
          if (!solvedToday && dsaProgress.streak > 0) {
            await Notification.create({
              userId: user._id,
              title: 'Keep Your Streak Alive!',
              message: `You haven't solved a DSA problem today. Don't lose your ${dsaProgress.streak} day streak!`,
              type: 'DSA_REMINDER'
            });
          }
        }
      }

      // Post-Interview Ghosting Nudges
      const ghostingEvents = await Event.find({
        type: 'interview',
        expected_response_date: { $lte: today, $ne: null },
        ghosting_nudge_sent: false,
        response_received: false,
        response_follow_up_sent: false,
        status: { $in: ['upcoming', 'completed'] },
        'reflection.outcome': { $in: ['none', 'awaiting_result'] }
      });

      for (const ev of ghostingEvents) {
        await Notification.create({
          userId: ev.user,
          title: 'Interview Follow-Up Reminder',
          message: `It's past the expected response date for your "${ev.title}" interview. Consider sending a polite follow-up.`,
          type: 'FOLLOW_UP_NUDGE',
          eventId: ev._id
        });
        ev.ghosting_nudge_sent = true;
        await ev.save();
      }

      // Peer Benchmarking Aggregation
      console.log('Running daily peer benchmarking aggregation...');
      const AggregatedStats = require('../models/AggregatedStats');
      // Group users by gradYear who haven't opted out
      const eligibleUsers = await User.find({ 
        gradYear: { $exists: true, $ne: '' },
        benchmarkOptIn: true
      });
      
      const usersByCohort = {};
      eligibleUsers.forEach(u => {
        if (!usersByCohort[u.gradYear]) usersByCohort[u.gradYear] = [];
        usersByCohort[u.gradYear].push(u._id);
      });

      for (const cohortYear of Object.keys(usersByCohort)) {
        const cohortUserIds = usersByCohort[cohortYear];
        const totalUsers = cohortUserIds.length;
        if (totalUsers === 0) continue;

        // Start of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Fetch applications for this cohort this month
        const apps = await Application.find({
          userId: { $in: cohortUserIds },
          appliedDate: { $gte: startOfMonth }
        });

        // Fetch DSA for this cohort
        const dsas = await DSA.find({ user: { $in: cohortUserIds } });

        // Fetch interviews for conversion rate
        const interviews = await Interview.find({ userId: { $in: cohortUserIds } });

        // Fetch resumes and resume analyses for this cohort
        const Resume = require('../models/Resume');
        const ResumeAnalysis = require('../models/ResumeAnalysis');
        
        const resumes = await Resume.find({ user: { $in: cohortUserIds }, isPrimary: true });
        const resumeIds = resumes.map(r => r._id);
        const analyses = await ResumeAnalysis.find({ resumeId: { $in: resumeIds } });

        const avgApps = apps.length / totalUsers;
        const avgDSA = dsas.reduce((acc, d) => acc + (d.solvedProblems ? d.solvedProblems.length : 0), 0) / totalUsers;
        
        // Fetch active goals for benchmarking
        const goals = await Goal.find({ user_id: { $in: cohortUserIds }, status: 'active' });
        const appGoals = goals.filter(g => g.linked_module === 'applications');
        const dsaGoals = goals.filter(g => g.linked_module === 'dsa_tracker');
        const netGoals = goals.filter(g => g.linked_module === 'networking');

        const avgGoalTargetApps = appGoals.length > 0 ? appGoals.reduce((sum, g) => sum + g.target_value, 0) / appGoals.length : 0;
        const avgGoalTargetDSA = dsaGoals.length > 0 ? dsaGoals.reduce((sum, g) => sum + g.target_value, 0) / dsaGoals.length : 0;
        const avgGoalTargetNetwork = netGoals.length > 0 ? netGoals.reduce((sum, g) => sum + g.target_value, 0) / netGoals.length : 0;

        let totalInterviews = interviews.length;
        let selectedInterviews = interviews.filter(i => i.status === 'Offer' || i.status === 'Done').length; // Assuming Done/Offer indicates success for this metric
        const avgConversion = totalInterviews > 0 ? (selectedInterviews / totalInterviews) * 100 : 0;

        let avgATSScore = 0;
        let avgSkillsCount = 0;
        let avgSectionCompleteness = 0;
        let avgQuantifiedAchievements = 0;

        if (analyses.length > 0) {
          avgATSScore = analyses.reduce((acc, a) => acc + (a.atsScore || 0), 0) / analyses.length;
          avgSkillsCount = analyses.reduce((acc, a) => acc + (a.skillsDetected ? a.skillsDetected.length : 0), 0) / analyses.length;
          
          // Approximating completeness based on presence of keywords/sections.
          // Since we don't have exact metrics, we use wordCount as a proxy or just hardcode for demo purposes, 
          // or we can use the analysis length of arrays. Let's assume completeness is a proxy of ATS score * 0.9 + 10.
          avgSectionCompleteness = avgATSScore * 0.9 + 10;
          
          // Proxy quantified achievements as (atsScore / 20)
          avgQuantifiedAchievements = avgATSScore / 20;
        }

        await AggregatedStats.findOneAndUpdate(
          { cohortYear, date: today },
          {
            cohortYear,
            date: today,
            avgApplications: Math.round(avgApps * 10) / 10,
            avgDSASolved: Math.round(avgDSA * 10) / 10,
            avgInterviewConversion: Math.round(avgConversion * 10) / 10,
            totalUsersSampled: totalUsers,
            avgATSScore: Math.round(avgATSScore * 10) / 10,
            avgSkillsCount: Math.round(avgSkillsCount * 10) / 10,
            avgSectionCompleteness: Math.round(avgSectionCompleteness * 10) / 10,
            avgQuantifiedAchievements: Math.round(avgQuantifiedAchievements * 10) / 10,
            avgGoalTargetApps: Math.round(avgGoalTargetApps * 10) / 10,
            avgGoalTargetDSA: Math.round(avgGoalTargetDSA * 10) / 10,
            avgGoalTargetNetwork: Math.round(avgGoalTargetNetwork * 10) / 10
          },
          { upsert: true, new: true }
        );
      }

      // Send emails and WhatsApp messages
      const { sendWhatsAppMessage } = require('../controllers/botController');
      for (const userId in userReminders) {
        const user = await User.findById(userId);
        if (user) {
          const reminders = userReminders[userId];
          const messageText = `Hello ${user.name},\n\nHere are your reminders for today and tomorrow:\n\n${reminders.join('\n')}\n\nGood luck!`;

          if (user.email) {
            await sendEmail({
              to: user.email,
              subject: 'StudentTracker - Your Daily Reminders',
              text: messageText,
            });
          }

          if (user.phone) {
            await sendWhatsAppMessage(user.phone, messageText);
          }
        }
      }

      // Post-Interview Follow-Up Nudges
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pastInterviews = await Event.find({
        type: 'interview',
        status: { $nin: ['completed', 'cancelled'] },
        followUpNudgeSent: { $ne: true }
      });

      for (const interviewEvent of pastInterviews) {
        const eventDateTime = new Date(interviewEvent.date);
        if (interviewEvent.start_time) {
          const [h, m] = interviewEvent.start_time.split(':').map(Number);
          eventDateTime.setUTCHours(h, m, 0, 0);
        } else {
          eventDateTime.setUTCHours(9, 0, 0, 0);
        }

        if (eventDateTime <= twentyFourHoursAgo) {
          const user = await User.findById(interviewEvent.user);
          if (user && user.calendarSettings?.disablePrepSuggestions) {
            continue;
          }

          const cleanCompany = interviewEvent.title.replace(/Interview:?/gi, '').trim();
          
          await Notification.create({
            userId: interviewEvent.user,
            title: `Thank-You Note Reminder`,
            message: `Sent a thank-you note to ${cleanCompany} yet?`,
            type: 'FOLLOW_UP_NUDGE',
            eventId: interviewEvent._id,
            link: `/calendar?date=${new Date(interviewEvent.date).toISOString().split('T')[0]}`
          });

          interviewEvent.followUpNudgeSent = true;
          await interviewEvent.save();
        }
      }

    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });

  // 1-minute cron job for Event Reminders
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find events that have active reminders and haven't sent yet
      const eventsWithReminders = await Event.find({
        status: 'upcoming'
      }).populate('user', 'calendarSettings phone');

      const Notification = require('../models/Notification');

      for (const event of eventsWithReminders) {
        const userSettings = event.user.calendarSettings || {};
        
        const eventDate = new Date(event.date);
        if (event.start_time && !event.is_all_day) {
          const [h, m] = event.start_time.split(':').map(Number);
          eventDate.setHours(h, m, 0, 0);
        } else {
          eventDate.setHours(9, 0, 0, 0);
        }

        const timeToEventMs = eventDate.getTime() - now.getTime();
        const timeToEventHrs = timeToEventMs / (1000 * 60 * 60);

        // Escalation Logic for High-Stakes (Interviews)
        if (event.type === 'interview' && !event.disableReminderEscalation && !userSettings.suppressIndividualReminders) {
          if (!event.highStakesRemindersSent) {
             event.highStakesRemindersSent = { oneWeek: false, oneDay: false, twoHours: false };
          }
          
          let escalationSent = false;
          
          const { sendWhatsAppMessage } = require('../controllers/botController');

          if (timeToEventHrs <= 168 && timeToEventHrs > 167 && !event.highStakesRemindersSent.oneWeek) {
            const msg = `Your interview is in exactly one week. Have you started preparing?`;
            await Notification.create({
              userId: event.user._id,
              title: `One Week Prep Warning: ${event.title}`,
              message: msg,
              type: 'CALENDAR',
              link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
            });
            if (event.user.phone) await sendWhatsAppMessage(event.user.phone, `🎯 One Week Prep Warning: ${event.title}\n\n${msg}`);
            event.highStakesRemindersSent.oneWeek = true;
            escalationSent = true;
          }
          
          if (timeToEventHrs <= 24 && timeToEventHrs > 23 && !event.highStakesRemindersSent.oneDay) {
            const msg = `Your interview is tomorrow! Ensure your setup is ready and get a good night's sleep.`;
            await Notification.create({
              userId: event.user._id,
              title: `Tomorrow: ${event.title}`,
              message: msg,
              type: 'CALENDAR',
              link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
            });
            if (event.user.phone) await sendWhatsAppMessage(event.user.phone, `🎯 Tomorrow: ${event.title}\n\n${msg}`);
            event.highStakesRemindersSent.oneDay = true;
            escalationSent = true;
          }
          
          if (timeToEventHrs <= 2 && timeToEventHrs > 1 && !event.highStakesRemindersSent.twoHours) {
            const msg = `Your interview starts in 2 hours. Final review of your prep notes!`;
            await Notification.create({
              userId: event.user._id,
              title: `Almost Time: ${event.title}`,
              message: msg,
              type: 'CALENDAR',
              link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
            });
            if (event.user.phone) await sendWhatsAppMessage(event.user.phone, `🎯 Almost Time: ${event.title}\n\n${msg}`);
            event.highStakesRemindersSent.twoHours = true;
            escalationSent = true;
          }
          
          if (escalationSent) {
            await event.save();
          }
        }

        // Escalation Logic for Offer Deadlines (1 week, 2 days, day-of)
        if (event.type === 'offer_deadline' && !event.disableReminderEscalation && !userSettings.suppressIndividualReminders) {
          if (!event.highStakesRemindersSent) {
             event.highStakesRemindersSent = { oneWeek: false, oneDay: false, twoHours: false }; // reusing schema fields
          }
          
          let escalationSent = false;
          const { sendWhatsAppMessage } = require('../controllers/botController');

          if (timeToEventHrs <= 168 && timeToEventHrs > 167 && !event.highStakesRemindersSent.oneWeek) {
            const msg = `Your offer deadline for ${event.title.split('—')[0].trim()} is exactly one week away. Time to start negotiating or making a decision.`;
            await Notification.create({
              userId: event.user._id,
              title: `One Week Offer Deadline: ${event.title.split('—')[0].trim()}`,
              message: msg,
              type: 'CALENDAR',
              link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
            });
            if (event.user.phone) await sendWhatsAppMessage(event.user.phone, `💸 Offer Reminder: ${event.title}\n\n${msg}`);
            event.highStakesRemindersSent.oneWeek = true;
            escalationSent = true;
          }
          
          if (timeToEventHrs <= 48 && timeToEventHrs > 47 && !event.highStakesRemindersSent.oneDay) { // Reusing oneDay for "2 days"
            const msg = `Your offer deadline for ${event.title.split('—')[0].trim()} is in 48 hours. Don't let this expire!`;
            await Notification.create({
              userId: event.user._id,
              title: `48 Hours Left: ${event.title.split('—')[0].trim()}`,
              message: msg,
              type: 'CALENDAR',
              link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
            });
            if (event.user.phone) await sendWhatsAppMessage(event.user.phone, `💸 Offer Reminder: ${event.title}\n\n${msg}`);
            event.highStakesRemindersSent.oneDay = true;
            escalationSent = true;
          }
          
          if (timeToEventHrs <= 24 && timeToEventHrs > 23 && !event.highStakesRemindersSent.twoHours) { // Reusing twoHours for "day-of/24h"
            const msg = `Your offer deadline for ${event.title.split('—')[0].trim()} expires TODAY. Action required.`;
            await Notification.create({
              userId: event.user._id,
              title: `Deadline TODAY: ${event.title.split('—')[0].trim()}`,
              message: msg,
              type: 'CALENDAR',
              link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
            });
            if (event.user.phone) await sendWhatsAppMessage(event.user.phone, `💸 Final Offer Reminder: ${event.title}\n\n${msg}`);
            event.highStakesRemindersSent.twoHours = true;
            escalationSent = true;
          }
          
          if (escalationSent) {
            await event.save();
          }
        }

        // Standard Reminder Logic
        if (event.reminder_minutes_before !== null && !event.reminderSent && !userSettings.suppressIndividualReminders) {
          const triggerTime = new Date(eventDate.getTime() - event.reminder_minutes_before * 60000);
          
          if (now >= triggerTime) {
            let icon = '🗓️';
            if (event.type === 'interview') icon = '🎯';
            else if (event.type === 'application_deadline' || event.type === 'deadline') icon = '⏳';
            else if (event.type === 'offer_deadline') icon = '💸';

            const todayDate = new Date();
            todayDate.setHours(0,0,0,0);
            const compDate = new Date(event.date);
            compDate.setHours(0,0,0,0);
            
            const diffDays = Math.round((compDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
            
            let dayString = `on ${eventDate.toLocaleDateString()}`;
            if (diffDays === 0) dayString = 'today';
            else if (diffDays === 1) dayString = 'tomorrow';

            const timeString = event.is_all_day ? 'all day' : `at ${event.start_time}`;

            const msgText = `${icon} Reminder: ${event.title} — ${timeString} ${dayString}`;

            await Notification.create({
              userId: event.user._id,
              title: `Reminder: ${event.title}`,
              message: msgText,
              type: 'CALENDAR',
              link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
            });

            if (event.user.phone) {
              const { sendWhatsAppMessage } = require('../controllers/botController');
              await sendWhatsAppMessage(event.user.phone, msgText);
            }

            event.reminderSent = true;
            await event.save();
          }
        }
      }
    } catch (err) {
      console.error('Error running 1-minute reminder cron job:', err);
    }
  });

  // Daily status tracker (marks past events as missed at 12:01 AM everyday)
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('Running daily missed status updater...');
      const today = new Date();
      today.setHours(0,0,0,0);

      const result = await Event.updateMany(
        {
          date: { $lt: today },
          status: 'upcoming',
          type: { $in: ['interview', 'application_deadline', 'offer_deadline', 'deadline'] }
        },
        { $set: { status: 'missed' } }
      );
      console.log(`Updated ${result.modifiedCount} past events to 'missed' status.`);
    } catch (err) {
      console.error('Error running daily status cron job:', err);
    }
  });

  // 15-minute cron job to pull Google Calendar events for connected users
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Running 15-minute Google Calendar pull worker...');
      const User = require('../models/User');
      const { pullEventsFromGoogle } = require('./googleSync');
      
      const users = await User.find({ 'googleCalendarSync.connected': true });
      for (const user of users) {
        await pullEventsFromGoogle(user);
      }
    } catch (err) {
      console.error('Error running 15-minute Google Calendar pull worker:', err);
    }
  });

  // Daily at 00:05 to take Goal Snapshots
  cron.schedule('5 0 * * *', async () => {
    try {
      console.log('Running daily goal snapshot worker...');
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const isMonday = today.getDay() === 1;
      const isFirstOfMonth = today.getDate() === 1;

      if (!isMonday && !isFirstOfMonth) return; // Only run on week/month boundaries

      const activeGoals = await Goal.find({ status: { $in: ['active', 'paused'] } });
      
      for (const goal of activeGoals) {
        if (goal.period === 'weekly' && !isMonday) continue;
        if (goal.period === 'monthly' && !isFirstOfMonth) continue;

        // The period just ended yesterday
        const periodEnd = new Date(today);
        periodEnd.setMilliseconds(-1); // 23:59:59.999 of yesterday
        
        const periodStart = new Date(periodEnd);
        periodStart.setHours(0,0,0,0);
        if (goal.period === 'weekly') {
          periodStart.setDate(periodStart.getDate() - 6);
        } else {
          periodStart.setDate(1);
        }

        // Check if snapshot already exists (idempotency)
        const existing = await GoalPeriodSnapshot.findOne({
          goal_id: goal._id,
          period_end: { $gte: periodEnd.setHours(0,0,0,0), $lte: new Date(periodEnd).setHours(23,59,59,999) }
        });

        if (!existing) {
          const entries = await GoalProgressEntry.aggregate([
            { $match: { goal_id: goal._id, logged_at: { $gte: periodStart, $lte: periodEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]);
          
          const completed = entries.length > 0 ? entries[0].total : 0;

          await GoalPeriodSnapshot.create({
            goal_id: goal._id,
            period_start: periodStart,
            period_end: periodEnd,
            target_value_at_period: goal.target_value,
            final_completed_value: completed
          });
        }
      }
      console.log('Daily goal snapshot worker completed.');
    } catch (err) {
      console.error('Error running goal snapshot worker:', err);
    }
  });
};

module.exports = startCronJobs;
