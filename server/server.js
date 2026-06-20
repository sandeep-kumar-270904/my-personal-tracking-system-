require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const publicRoutes = require('./routes/publicRoutes');
const pushRoutes = require('./routes/pushRoutes');
const exportRoutes = require('./routes/exportRoutes');
const prephubRoutes = require('./routes/prephubRoutes');
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

// Initialize Cron Jobs
initCronJobs();

const app = express();

// Connect to Database
connectDB();

// Start Cron Jobs for Reminders
startCronJobs();

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/events', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/networking', require('./routes/networkingRoutes'));
app.use('/api/prephub', require('./routes/prepHubRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/data', exportRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/campus-drives', campusDriveRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/bot', botRoutes);

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
