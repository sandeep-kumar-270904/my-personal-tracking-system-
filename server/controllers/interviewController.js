const Interview = require('../models/Interview');

// @desc    Get user interviews
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id }).sort({ scheduledAt: 1 });
    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const Contest = require('../models/Contest');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = async (req, res) => {
  const { company, role, scheduledAt, round, type, notes, status, interviewer, followUpDate, ignoreWarning } = req.body;

  try {
    const interviewTime = new Date(scheduledAt);

    if (!ignoreWarning && scheduledAt) {
      // 1. Check existing interviews (2 hour window)
      const twoHoursBefore = new Date(interviewTime.getTime() - 2 * 60 * 60 * 1000);
      const twoHoursAfter = new Date(interviewTime.getTime() + 2 * 60 * 60 * 1000);

      const existingInterview = await Interview.findOne({
        userId: req.user._id,
        scheduledAt: { $gte: twoHoursBefore, $lte: twoHoursAfter }
      });

      if (existingInterview) {
        return res.status(200).json({ 
          isConflict: true, 
          warning: `You already have an interview with ${existingInterview.company} at ${new Date(existingInterview.scheduledAt).toLocaleTimeString()} — are you sure?` 
        });
      }

      // 2. Check contests (3 hour window)
      const threeHoursBefore = new Date(interviewTime.getTime() - 3 * 60 * 60 * 1000);
      const threeHoursAfter = new Date(interviewTime.getTime() + 3 * 60 * 60 * 1000);
      
      const existingContest = await Contest.findOne({
        userId: req.user._id,
        date: { $gte: threeHoursBefore, $lte: threeHoursAfter }
      });

      if (existingContest) {
        return res.status(200).json({ 
          isConflict: true, 
          warning: `${existingContest.platform} contest starts within 3 hours of this interview — you may want to reschedule or skip the contest.` 
        });
      }
    }

    const interview = await Interview.create({
      userId: req.user._id,
      company,
      role,
      scheduledAt,
      round,
      type,
      notes,
      status: status || 'UPCOMING',
      interviewer,
      followUpDate,
    });

    if (scheduledAt) {
      // Create Calendar event
      await Event.create({
        userId: req.user._id,
        title: `Interview: ${company} - ${role}`,
        type: 'INTERVIEW',
        date: interviewTime,
        description: `Round: ${round}, Type: ${type}`
      });

      // Create Notification 1 hour before
      const notifyTime = new Date(interviewTime.getTime() - 60 * 60 * 1000);
      if (notifyTime > new Date()) {
        await Notification.create({
          userId: req.user._id,
          title: `Upcoming Interview: ${company}`,
          message: `Your interview for ${role} is starting in 1 hour.`,
          type: 'REMINDER',
          scheduledFor: notifyTime,
          isRead: false
        });
      }
    }

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedInterview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedInterview);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private
const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.status(200).json({ message: 'Interview removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete interview', error: error.message });
  }
};

// @desc    Generate AI Prep Brief for Interview
// @route   POST /api/interviews/:id/prep-brief
// @access  Private
const generatePrepBrief = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const { callGemini } = require('./aiController');
    
    const prompt = `
      You are an expert technical recruiter and interview coach.
      Generate a comprehensive 'Prep Brief' for an upcoming interview.
      
      Company: ${interview.company}
      Role: ${interview.role}
      Type: ${interview.type}
      Round: ${interview.round}

      Output the response in markdown format with the following sections:
      1. Company Overview & Recent News
      2. Common Interview Questions for ${interview.role} at ${interview.company} (or general if unknown)
      3. Key Technical Concepts to Review
      4. Behavioral Tips
    `;

    const prepBrief = await callGemini(prompt);
    
    interview.prepBrief = prepBrief;
    await interview.save();

    res.status(200).json({ prepBrief });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate prep brief', error: error.message });
  }
};

module.exports = {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  generatePrepBrief
};
