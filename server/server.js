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
const goalRoutes = require('./routes/goalRoutes');
const offerRoutes = require('./routes/offerRoutes');
const eventRoutes = require('./routes/eventRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const startCronJobs = require('./utils/cron');

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
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('Smart Internship & Career Tracker API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
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
