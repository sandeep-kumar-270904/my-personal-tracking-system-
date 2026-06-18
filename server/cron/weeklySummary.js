const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const DSA = require('../models/DSA');
const Goal = require('../models/Goal');

// Helper to get start and end of previous week (Sunday to Saturday)
const getPreviousWeekBounds = () => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(0,0,0,0);
  end.setDate(end.getDate() - now.getDay()); // Start of this week (Sunday 00:00)
  
  const start = new Date(end);
  start.setDate(start.getDate() - 7); // Start of previous week

  end.setHours(23,59,59,999);
  end.setDate(end.getDate() - 1); // End of previous week (Saturday 23:59)
  
  return { start, end };
};

const sendWeeklySummaries = async () => {
  console.log('Starting weekly summary email job...');
  
  try {
    // In a real app, use environment variables for transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const { start, end } = getPreviousWeekBounds();
    
    // Find users with weekly email enabled
    const users = await User.find({ 'notificationPreferences.weeklyEmail': true });

    for (const user of users) {
      try {
        const userId = user._id;

        // Fetch stats for the previous week
        const applications = await Application.countDocuments({ userId, dateApplied: { $gte: start, $lte: end } });
        const interviews = await Interview.countDocuments({ userId, scheduledAt: { $gte: start, $lte: end } });
        const dsa = await DSA.countDocuments({ userId, solvedAt: { $gte: start, $lte: end } });
        
        const goal = await Goal.findOne({ user: userId, weekStartDate: { $gte: start, $lte: end } });
        let goalCompletion = 0;
        if (goal) {
          const p1 = Math.min(100, goal.applicationsTarget > 0 ? (goal.applicationsCompleted / goal.applicationsTarget) * 100 : 0);
          const p2 = Math.min(100, goal.dsaTarget > 0 ? (goal.dsaCompleted / goal.dsaTarget) * 100 : 0);
          const p3 = Math.min(100, goal.networkingTarget > 0 ? (goal.networkingCompleted / goal.networkingTarget) * 100 : 0);
          goalCompletion = Math.round((p1 + p2 + p3) / 3);
        }

        const html = \`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #ff6b00;">Your week in review — StudentTracker</h2>
            <p>Hi \${user.name},</p>
            <p>Here's a quick summary of your placement preparation activity from the past week:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Applications Added</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">\${applications}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Interviews Scheduled/Completed</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">\${interviews}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>DSA Problems Solved</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">\${dsa}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Weekly Goal Completion</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">\${goalCompletion}%</td>
              </tr>
            </table>
            
            <p style="margin-top: 30px;">Keep up the great work! Consistent effort is the key to cracking placement season.</p>
            <a href="\${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 10px 20px; background-color: #ff6b00; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Go to Dashboard</a>
          </div>
        \`;

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail({
            from: '"StudentTracker" <noreply@studenttracker.com>',
            to: user.email,
            subject: 'Your week in review — StudentTracker',
            html
          });
        } else {
          // If no email configured, just log it
          console.log(\`[Email Job] Would send weekly summary to \${user.email}: \${applications} apps, \${dsa} dsa, \${goalCompletion}% goals\`);
        }
      } catch (err) {
        console.error(\`Failed to generate email for user \${user._id}:\`, err);
      }
    }
    console.log('Weekly summary email job completed.');
  } catch (error) {
    console.error('Error running weekly summary job:', error);
  }
};

const initCronJobs = () => {
  // Run every Monday at 8:00 AM
  cron.schedule('0 8 * * 1', () => {
    sendWeeklySummaries();
  }, {
    timezone: "Asia/Kolkata"
  });
};

module.exports = { initCronJobs, sendWeeklySummaries };
