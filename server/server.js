require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const appRoutes = require('./routes/appRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const dsaRoutes = require('./routes/dsaRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/interviews', interviewRoutes);

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
