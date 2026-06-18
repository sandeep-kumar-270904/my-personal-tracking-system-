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

        const avgApps = apps.length / totalUsers;
        const avgDSA = dsas.reduce((acc, d) => acc + (d.solvedProblems ? d.solvedProblems.length : 0), 0) / totalUsers;
        
        let totalInterviews = interviews.length;
        let selectedInterviews = interviews.filter(i => i.status === 'Offer' || i.status === 'Done').length; // Assuming Done/Offer indicates success for this metric
        const avgConversion = totalInterviews > 0 ? (selectedInterviews / totalInterviews) * 100 : 0;

        await AggregatedStats.findOneAndUpdate(
          { cohortYear, date: today },
          {
            cohortYear,
            date: today,
            avgApplications: Math.round(avgApps * 10) / 10,
            avgDSASolved: Math.round(avgDSA * 10) / 10,
            avgInterviewConversion: Math.round(avgConversion * 10) / 10,
            totalUsersSampled: totalUsers
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
};

module.exports = startCronJobs;
