const Interview = require('../models/Interview');

// @desc    Get user interviews
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id }).sort({ interviewDate: 1 });
    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = async (req, res) => {
  const { company, interviewDate, round, notes, status } = req.body;

  try {
    const interview = await Interview.create({
      userId: req.user._id,
      company,
      interviewDate,
      round,
      notes,
      status: status || 'Scheduled',
    });

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
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await interview.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
};
