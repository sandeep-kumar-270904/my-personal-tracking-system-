const Interview = require('../models/Interview');
const { syncEventFromSource, removeEventForSource } = require('../utils/calendarSync');
const { recordGoalProgress } = require('../services/goalTrackingService');

// @desc    Get user interviews
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id }).sort({ scheduledAt: 1 }).lean();
    
    // Attach network data
    const Network = require('../models/Network');
    const interviewCompanies = interviews.map(i => i.company);
    const networkContacts = await Network.find({
      userId: req.user._id,
      company: { $in: interviewCompanies },
      isDeleted: false
    });

    const interviewsWithNetworking = interviews.map(interview => {
      const companyContacts = networkContacts.filter(c => c.company === interview.company);
      return {
        ...interview,
        network: {
          contactCount: companyContacts.length
        }
      };
    });

    res.status(200).json(interviewsWithNetworking);
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
      await syncEventFromSource('interview', interview);
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

    const previousOutcome = interview.outcome;

    const updatedInterview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (updatedInterview) {
      await syncEventFromSource('interview', updatedInterview);
    }

    // v5 Interview Rounds Completed Auto-Tracking
    const completedOutcomes = ['PASSED', 'FAILED', 'AWAITING_RESULT'];
    if (previousOutcome === 'PENDING' && completedOutcomes.includes(updatedInterview.outcome)) {
      await recordGoalProgress(req.user._id, 'interviews', 1, updatedInterview._id);
    }

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
    
    await removeEventForSource('interview', req.params.id);
    
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

// @desc    V4 RX2: Extract resume signals from interview debrief
// @route   POST /api/interviews/:id/extract-resume-signals
// @access  Internal hook
const extractResumeSignals = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const interview = await Interview.findById(interviewId);
    if (!interview || !interview.debrief || !interview.applicationId) return res.json({ message: 'No debrief or application linked' });

    const Application = require('../models/Application');
    const ResumeSection = require('../models/ResumeSection');
    const InterviewResumeSignal = require('../models/InterviewResumeSignal');
    
    const application = await Application.findById(interview.applicationId);
    if (!application || !application.resumeId) return res.json({ message: 'No resume linked to this interview application' });

    const resumeId = application.resumeId;
    const sections = await ResumeSection.find({ resumeId });
    if (!sections.length) return res.json({ message: 'Resume has no sections' });

    // Check if we already extracted signals for this interview to prevent infinite loops from saves
    const existingSignals = await InterviewResumeSignal.countDocuments({ interviewId });
    if (existingSignals > 0) return res.json({ message: 'Signals already extracted for this interview' });

    const { ai } = require('../../aiService'); // We will use the common google/genai implementation from other files
    // The prompt says we should send debrief text to LLM and get signals.
    const prompt = `Analyze this interview debrief against the candidate's resume sections.
Debrief: "${interview.debrief}"
Resume Sections: ${JSON.stringify(sections.map(s => s.content))}

Identify any signals from the interviewer about the candidate's resume.
Return JSON ONLY with these arrays (empty if none):
{
  "positiveSignals": ["things praised that are on resume"],
  "negativeSignals": ["things criticized that are on resume"],
  "missingSkills": ["things asked about that weren't on resume"],
  "strengthConfirmations": ["resume claims validated"]
}
Only output valid JSON.`;

    const { GoogleGenAI } = require('@google/genai');
    const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawJson = response.text.trim();
    if (rawJson.startsWith('```json')) rawJson = rawJson.slice(7, -3).trim();

    let result;
    try {
      result = JSON.parse(rawJson);
    } catch(e) {
      return res.json({ message: 'Failed to parse LLM response' });
    }

    const newSignals = [];

    if (result.positiveSignals) result.positiveSignals.forEach(content => newSignals.push({ interviewId, resumeId, userId: interview.userId, signalType: 'POSITIVE', content }));
    if (result.negativeSignals) result.negativeSignals.forEach(content => newSignals.push({ interviewId, resumeId, userId: interview.userId, signalType: 'NEGATIVE', content }));
    if (result.missingSkills) result.missingSkills.forEach(content => newSignals.push({ interviewId, resumeId, userId: interview.userId, signalType: 'MISSING_SKILL', content }));
    if (result.strengthConfirmations) result.strengthConfirmations.forEach(content => newSignals.push({ interviewId, resumeId, userId: interview.userId, signalType: 'STRENGTH_CONFIRMED', content }));

    if (newSignals.length > 0) {
      await InterviewResumeSignal.insertMany(newSignals);
      
      const UnifiedTimeline = require('../models/UnifiedTimeline');
      if (UnifiedTimeline) {
        await UnifiedTimeline.create({
          userId: interview.userId,
          eventType: 'INTERVIEW_RESUME_SIGNAL',
          content: `Extracted ${newSignals.length} intelligence signals from your ${interview.company} interview debrief.`,
          metadata: { resumeId }
        });
      }
    }

    res.json({ message: 'Extracted successfully', extracted: newSignals.length });
  } catch (error) {
    console.error('Signal Extraction Error:', error);
    res.status(500).json({ message: 'Extraction failed' });
  }
};

module.exports = {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  generatePrepBrief,
  extractResumeSignals
};
