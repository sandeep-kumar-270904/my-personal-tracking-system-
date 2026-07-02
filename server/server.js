require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const appRoutes = require('./routes/appRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const dsaRoutes = require('./routes/dsaRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const networkRoutes = require('./routes/networkRoutes');
const calendarRoutes = require('./routes/eventRoutes');
const goalRoutes = require('./routes/goalRoutes');
const offerRoutes = require('./routes/offerRoutes');
const offerCriteriaRoutes = require('./routes/offerCriteriaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const socialRoutes = require('./routes/socialRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const publicRoutes = require('./routes/publicRoutes');
const pushRoutes = require('./routes/pushRoutes');
const exportRoutes = require('./routes/exportRoutes');
const cronRoutes = require('./routes/cronRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const studyGroupRoutes = require('./routes/studyGroupRoutes');
const resourceChatRoutes = require('./routes/resourceChatRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const statsRoutes = require('./routes/statsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const campusDriveRoutes = require('./routes/campusDriveRoutes');
const benchmarkRoutes = require('./routes/benchmarkRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contestRoutes = require('./routes/contestRoutes');
const botRoutes = require('./routes/botRoutes');
const { initCronJobs } = require('./cron/weeklySummary');
const startCronJobs = require('./utils/cron');
const rateLimit = require('express-rate-limit');

// Initialize Cron Jobs
initCronJobs();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 2000 : 200, // higher limit for dev
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Connect to Database
connectDB();

// Start Cron Jobs for Reminders
startCronJobs();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Needed for Twilio Webhooks

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Serve static files from uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/offer-criteria', offerCriteriaRoutes);
app.use('/api/events', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/ai', aiRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/discussion', discussionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/networking', require('./routes/networkingRoutes'));
app.use('/api/prephub', require('./routes/prepHubRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/gamification', gamificationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/study-groups', studyGroupRoutes);
app.use('/api/resource-chat', resourceChatRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/my-stats', statsRoutes);
app.use('/api/data', exportRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/campus-drives', campusDriveRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/reports', require('./routes/reportRoutes'));

app.get('/', (req, res) => {
  res.send('Smart Internship & Career Tracker API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
