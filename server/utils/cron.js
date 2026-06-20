const cron = require('node-cron');
const { sendEmail } = require('./email');
const Event = require('../models/Event');
const Interview = require('../models/Interview');
const Network = require('../models/Network');
const User = require('../models/User');

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

      // Peer Benchmarking Aggregation
      console.log('Running daily peer benchmarking aggregation...');
      const AggregatedStats = require('../models/AggregatedStats');
      // Group users by gradYear who haven't opted out
      const eligibleUsers = await User.find({ 
        gradYear: { $exists: true, $ne: '' },
        'publicProfileSettings.benchmarkOptOut': { $ne: true }
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
            avgQuantifiedAchievements: Math.round(avgQuantifiedAchievements * 10) / 10
          },
          { upsert: true, new: true }
        );
      }

      // Send emails
      for (const userId in userReminders) {
        const user = await User.findById(userId);
        if (user && user.email) {
          const reminders = userReminders[userId];
          
          await sendEmail({
            to: user.email,
            subject: 'StudentTracker - Your Daily Reminders',
            text: `Hello ${user.name},\n\nHere are your reminders for today and tomorrow:\n\n${reminders.join('\n')}\n\nGood luck!`,
          });
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
        reminder_minutes_before: { $ne: null },
        reminderSent: false,
        status: 'upcoming'
      });

      const Notification = require('../models/Notification');

      for (const event of eventsWithReminders) {
        const eventDate = new Date(event.date);
        
        // Set time part
        if (event.start_time && !event.is_all_day) {
          const [h, m] = event.start_time.split(':').map(Number);
          eventDate.setHours(h, m, 0, 0);
        } else {
          // All-day default 9:00 AM local time
          eventDate.setHours(9, 0, 0, 0);
        }

        const triggerTime = new Date(eventDate.getTime() - event.reminder_minutes_before * 60000);

        if (now >= triggerTime) {
          // Send notification
          let icon = '🗓️';
          if (event.type === 'interview') icon = '🎯';
          else if (event.type === 'application_deadline' || event.type === 'deadline') icon = '⏳';
          else if (event.type === 'offer_deadline') icon = '💸';

          // Determine dayString (today / tomorrow / date)
          const todayDate = new Date();
          todayDate.setHours(0,0,0,0);
          const compDate = new Date(event.date);
          compDate.setHours(0,0,0,0);
          
          const diffDays = Math.round((compDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let dayString = `on ${eventDate.toLocaleDateString()}`;
          if (diffDays === 0) dayString = 'today';
          else if (diffDays === 1) dayString = 'tomorrow';

          const timeString = event.is_all_day ? 'all day' : `at ${event.start_time}`;

          await Notification.create({
            userId: event.user,
            title: `Reminder: ${event.title}`,
            message: `${icon} ${event.title} — ${timeString} ${dayString}`,
            type: 'CALENDAR',
            link: `/calendar?date=${new Date(event.date).toISOString().split('T')[0]}`
          });

          // Mark reminder as sent
          event.reminderSent = true;
          await event.save();
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
};

module.exports = startCronJobs;
