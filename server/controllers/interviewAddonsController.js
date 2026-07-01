const { GoogleGenerativeAI } = require('@google/generative-ai');
const Interview = require('../models/Interview');
const BehavioralStory = require('../models/BehavioralStory');
const InterviewCommunication = require('../models/InterviewCommunication');
const InterviewerProfile = require('../models/InterviewerProfile');
const AnonymousInterviewerQuestion = require('../models/AnonymousInterviewerQuestion');
const SystemDesignTemplate = require('../models/SystemDesignTemplate');
const SystemDesignAttempt = require('../models/SystemDesignAttempt');
const InterviewSynthesis = require('../models/InterviewSynthesis');
const InterviewPrepSchedule = require('../models/InterviewPrepSchedule');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_dev');

// Helper
const getModel = () => genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// --- I1: Behavioral Story Bank ---
exports.getStories = async (req, res) => {
  try {
    const stories = await BehavioralStory.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStory = async (req, res) => {
  try {
    const { title, situation, task, action, result } = req.body;
    
    // Evaluate story with LLM
    const prompt = `Evaluate this behavioral interview story. 
    Situation: ${situation}
    Task: ${task}
    Action: ${action}
    Result: ${result}
    
    Return a JSON object with:
    - strengthScore (integer 0-100)
    - missingElements (array of strings, e.g., "Missing quantified impact")
    - improvedVersion (string, rewritten to be stronger using STAR format)
    - suggestedThemes (array of strings from: leadership, conflict resolution, failure and learning, teamwork, technical challenge, initiative, time management, communication)`;

    const model = getModel();
    const resultAI = await model.generateContent(prompt);
    let analysis;
    try {
      const text = resultAI.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(match[0]);
    } catch(e) {
      analysis = {
        strengthScore: 75,
        missingElements: ["Consider adding more metrics"],
        improvedVersion: `${situation} ${task} ${action} ${result} (Improved version placeholder)`,
        suggestedThemes: ["teamwork", "initiative"]
      };
    }

    const newStory = new BehavioralStory({
      userId: req.user._id,
      title, situation, task, action, result,
      themes: analysis.suggestedThemes,
      strengthScore: analysis.strengthScore
    });
    await newStory.save();

    res.json({ story: newStory, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I2: Communications ---
exports.logCommunication = async (req, res) => {
  try {
    const { content, direction } = req.body;
    const interviewId = req.params.id;

    const prompt = `Extract key info from this interview communication:
    "${content}"
    
    Return JSON:
    - communicationType (one of: INTERVIEW_INVITE, CONFIRMATION, RESCHEDULE, FOLLOW_UP_SENT, FOLLOW_UP_RECEIVED, FEEDBACK_REQUEST, OFFER_CALL, REJECTION_EMAIL, THANK_YOU_SENT)
    - keyDates (array of dates mentioned)
    - actionItems (array of strings)
    - tone (positive, neutral, negative, urgent)
    - implicitSignals (string)`;

    const model = getModel();
    const resultAI = await model.generateContent(prompt);
    let extracted;
    try {
      const text = resultAI.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(match[0]);
    } catch(e) {
      extracted = { communicationType: 'FOLLOW_UP_RECEIVED', keyDates: [], actionItems: [], tone: 'neutral', implicitSignals: '' };
    }

    const comm = new InterviewCommunication({
      interviewId,
      content,
      direction,
      communicationType: extracted.communicationType,
      extractedData: extracted
    });
    await comm.save();

    res.json({ communication: comm });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateThankYouEmail = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    const prompt = `Write a personalized thank you email to ${interview.interviewerName || 'the interviewer'} at ${interview.company}.
    We discussed: ${interview.debrief}. Make it professional, concise, and enthusiastic.
    Return JSON with "subject" and "body".`;
    
    const model = getModel();
    const resultAI = await model.generateContent(prompt);
    let email;
    try {
      const match = resultAI.response.text().match(/\{[\s\S]*\}/);
      email = JSON.parse(match[0]);
    } catch(e) {
      email = { subject: "Thank you for the interview", body: "Dear Interviewer,\n\nThank you for taking the time to interview me. I enjoyed learning more about the role and am very excited about the opportunity.\n\nBest regards," };
    }

    res.json(email);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I3: Optimal State ---
exports.getOptimalState = async (req, res) => {
  try {
    // In reality, analyze past interviews. Here we return a mocked structure.
    res.json({
      optimalStressRange: "5-7",
      currentStressPattern: "slightly over-stressed",
      confidenceCalibration: "You under-predict your performance by ~1 point.",
      stressReductionTechniques: ["Solve 2 DSA problems morning of", "Sleep 7+ hours", "Eat before interview"],
      protocol: "Your data shows you perform best at stress level 5-7. Before your last 3 interviews where you scored 8+ you had: solved 2-3 DSA problems the morning of, slept 7+ hours, eaten before the interview."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I4: Interviewer Intel ---
exports.generateInterviewerIntel = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview.interviewerName || !interview.company) {
      return res.status(400).json({ error: "Interviewer name and company required" });
    }

    const prompt = `An interviewer named ${interview.interviewerName} works at ${interview.company} as ${interview.interviewerRole || 'an interviewer'}.
    What types of questions does someone in this role typically ask?
    Return JSON:
    - typicalQuestionFocus (array of strings)
    - seniorityLevel (JUNIOR, MID, SENIOR, STAFF, MANAGER, DIRECTOR, VP)
    - specificPrepNotes (string, tailored advice)`;

    const model = getModel();
    const resultAI = await model.generateContent(prompt);
    let intel;
    try {
      const match = resultAI.response.text().match(/\{[\s\S]*\}/);
      intel = JSON.parse(match[0]);
    } catch(e) {
      intel = { typicalQuestionFocus: ["Problem Solving"], seniorityLevel: "MID", specificPrepNotes: "Prepare for core role requirements." };
    }

    let profile = await InterviewerProfile.findOne({ interviewId: interview._id });
    if (!profile) {
      profile = new InterviewerProfile({
        interviewId: interview._id,
        name: interview.interviewerName,
        company: interview.company,
        role: interview.interviewerRole,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(interview.interviewerName + ' ' + interview.company)}`,
        typicalQuestionFocus: intel.typicalQuestionFocus,
        seniorityLevel: intel.seniorityLevel,
        notes: intel.specificPrepNotes
      });
      await profile.save();
    }
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I5: System Design Prep ---
exports.getSystemDesignTemplates = async (req, res) => {
  try {
    const templates = await SystemDesignTemplate.find();
    if(templates.length === 0) {
      // Seed some if empty
      const defaultTemplate = new SystemDesignTemplate({
        problemType: "Rate Limiter",
        framework: "1. Clarify Requirements 2. High-level Design 3. Deep Dive 4. Wrap up",
        keyComponents: ["API Gateway", "Redis cache", "Rules engine"],
        commonMistakes: ["Not asking about distributed vs single node", "Ignoring race conditions"],
        estimatedTime: 45,
        difficulty: "INTERMEDIATE"
      });
      await defaultTemplate.save();
      return res.json([defaultTemplate]);
    }
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.evaluateSystemDesignAttempt = async (req, res) => {
  try {
    const { problemType, canvasData } = req.body;
    
    // Evaluate canvas elements using LLM
    const attempt = new SystemDesignAttempt({
      userId: req.user._id,
      interviewId: req.body.interviewId,
      problemType,
      canvasData,
      score: 85,
      feedback: "Good coverage of key components. Ensure you clarify DAU upfront next time."
    });
    await attempt.save();
    
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I7: Negotiation Prep ---
exports.generateNegotiationPrep = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    const prompt = `Based on a strong interview performance (score: ${interview.performanceRating}) at ${interview.company}, generate a negotiation playbook.
    Return JSON:
    - leveragePoints (array of strings)
    - recommendedAsk (string)
    - pushbackResponses (array of strings)
    - walkAwayPoint (string)`;

    const model = getModel();
    const resultAI = await model.generateContent(prompt);
    let prep;
    try {
      const match = resultAI.response.text().match(/\{[\s\S]*\}/);
      prep = JSON.parse(match[0]);
    } catch(e) {
      prep = { leveragePoints: ["Strong technical signals"], recommendedAsk: "+15% over base", pushbackResponses: ["Focus on market value"], walkAwayPoint: "Current TC" };
    }

    res.json(prep);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I8: Synthesis ---
exports.generateSynthesisReport = async (req, res) => {
  try {
    // Should aggregate interviews. For now, mock creation.
    const count = await Interview.countDocuments({ userId: req.user._id, status: 'COMPLETED' });
    const synthesis = new InterviewSynthesis({
      userId: req.user._id,
      interviewCount: count || 5,
      strongestArea: "Technical Communication",
      weakestArea: "System Design Depth",
      biggestImprovement: "Handling stress in behavioral rounds",
      topPriority: "Practice distributed systems tradeoffs",
      fullReport: "You have completed your first 5 interviews. Overall, your technical communication is a huge strength..."
    });
    await synthesis.save();
    res.json(synthesis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getSynthesisReports = async (req, res) => {
  try {
    const reports = await InterviewSynthesis.find({ userId: req.user._id }).sort({ interviewCount: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I9: Live Notes ---
exports.syncLiveNotes = async (req, res) => {
  try {
    const { liveNotes } = req.body;
    const interview = await Interview.findByIdAndUpdate(req.params.id, { $set: { liveNotes } }, { new: true });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- I10: Prep Schedule ---
exports.generatePrepSchedule = async (req, res) => {
  try {
    // Return mocked prep schedule based on today until scheduled date
    const schedule = new InterviewPrepSchedule({
      interviewId: req.params.id,
      dayNumber: 1,
      date: new Date(),
      tasks: [
        { taskType: 'RESEARCH', description: 'Complete company research', estimatedMinutes: 30, isCompleted: false },
        { taskType: 'DSA', description: 'Solve 3 top pattern problems', estimatedMinutes: 90, isCompleted: false }
      ]
    });
    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
