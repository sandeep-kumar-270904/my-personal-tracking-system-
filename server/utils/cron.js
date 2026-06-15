const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Event = require('../models/Event');
const Interview = require('../models/Interview');
const Network = require('../models/Network');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use a real service in production, or test account
  auth: {
    user: process.env.EMAIL_USER || 'test@gmail.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
});

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

      // Send emails
      for (const userId in userReminders) {
        const user = await User.findById(userId);
        if (user && user.email) {
          const reminders = userReminders[userId];
          
          if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: user.email,
              subject: 'StudentTracker - Your Daily Reminders',
              text: `Hello ${user.name},\n\nHere are your reminders for today and tomorrow:\n\n${reminders.join('\n')}\n\nGood luck!`,
            });
            console.log(`Sent reminder email to ${user.email}`);
          } else {
            console.log(`(Simulation) Sent reminder email to ${user.email}: \n${reminders.join('\n')}`);
          }
        }
      }

    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });
};

module.exports = startCronJobs;
