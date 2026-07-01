const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const DSA = require('../models/DSA');
const DSATopic = require('../models/DSATopic');
const DSAWeaknessLog = require('../models/DSAWeaknessLog');
const InterviewPrepPlan = require('../models/InterviewPrepPlan');
const Goal = require('../models/Goal');
const Application = require('../models/Application');
const Contest = require('../models/Contest');
const Event = require('../models/Event');
const Network = require('../models/Network');
const PrepSyllabus = require('../models/PrepSyllabus');

// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// DX1: Resume to DSA JD Extractor
exports.extractResumeSignals = async (req, res) => {
  try {
    const { jdText, companyName } = req.body;
    const userId = req.user ? req.user.id : req.body.userId;

    const prompt = `Extract technical skills and specifically DSA topics/patterns from this Job Description: "${jdText}". Return a JSON array of strings representing the DSA topics.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    const topics = JSON.parse(text);

    // Update Weakness Log for each topic if mastery < INTERMEDIATE
    for (const topic of topics) {
      let dsaTopic = await DSATopic.findOne({ userId, topicName: topic });
      if (!dsaTopic) {
        dsaTopic = await DSATopic.create({ userId, topicName: topic });
      }
      
      if (['NOT_STARTED', 'BEGINNER'].includes(dsaTopic.masteryLevel)) {
        await DSAWeaknessLog.findOneAndUpdate(
          { userId, topic },
          { priority: 'HIGH', status: 'ACTIVE', source: 'JD_SIGNAL', notes: `Required for ${companyName}` },
          { upsert: true, new: true }
        );
      }
    }

    if (res) res.status(200).json({ message: 'JD signals processed', topics });
  } catch (error) {
    if (res) res.status(500).json({ error: error.message });
    else console.error('Error in extractResumeSignals:', error);
  }
};

// DX2: Interview Prep Mode
exports.activateInterviewPrepMode = async (req, res) => {
  try {
    // Can be called via HTTP or internally
    const interviewId = req.params?.id || req.body?.interviewId;
    const userId = req.user ? req.user.id : req.body.userId;
    const { companyName, interviewDate } = req.body; // In a real app we'd fetch Interview

    // Deactivate previous plans for this interview if any
    await InterviewPrepPlan.updateMany({ interviewId }, { isActive: false });

    // Generate prep plan via LLM
    const prompt = `Generate a daily DSA prep plan for an interview with ${companyName} on ${interviewDate}. Today is ${new Date().toISOString()}. Return JSON with "prepPlan" array, each day having "date", "patternsToPractice", "numberOfProblems".`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    const data = JSON.parse(text);

    const plan = await InterviewPrepPlan.create({
      userId,
      interviewId,
      companyName,
      interviewDate,
      prepPlan: data.prepPlan
    });

    if (res) res.status(201).json(plan);
  } catch (error) {
    if (res) res.status(500).json({ error: error.message });
    else console.error('Error in activateInterviewPrepMode:', error);
  }
};

// DX4: Application Intelligence Feed
exports.getApplicationIntelligence = async (req, res) => {
  try {
    const userId = req.user.id;
    // In reality, fetch from Application model where status not REJECTED/OFFER
    // For now, mock the aggregated intelligence
    const intelligence = {
      rankedPatterns: [
        { pattern: 'Dynamic Programming', score: 95, applications: ['Google', 'Amazon'] },
        { pattern: 'Graphs', score: 85, applications: ['Uber'] },
        { pattern: 'Sliding Window', score: 70, applications: ['Microsoft'] }
      ]
    };

    res.status(200).json(intelligence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DX5: Pre-contest brief
exports.generatePreContestBrief = async (req, res) => {
  try {
    const contestId = req.params.id;
    const userId = req.user.id;

    // Mock response for now
    const brief = {
      warmupProblems: ['Two Sum', 'Reverse Linked List'],
      mentalChecklist: ['Check constraints', 'Write base cases first'],
      confidenceCalibration: 'Target Mediums, avoid Hards unless you finish early.'
    };

    res.status(200).json(brief);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DX6: Schedule Study Blocks
exports.scheduleStudyBlocks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetHours } = req.body;

    // Mock generating calendar events
    const mockEvents = [
      { title: 'DSA Focus - Trees', date: new Date() },
      { title: 'DSA Focus - DP', date: new Date(Date.now() + 86400000) }
    ];

    res.status(201).json(mockEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DX7: Networking Signals
exports.extractNetworkingSignals = async (req, res) => {
  try {
    const { textShared, companyName } = req.body;
    const userId = req.user ? req.user.id : req.body.userId;

    const prompt = `Extract DSA topics mentioned in this networking contact message: "${textShared}". Return JSON array of strings.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    const topics = JSON.parse(text);

    for (const topic of topics) {
      await DSAWeaknessLog.findOneAndUpdate(
        { userId, topic },
        { priority: 'HIGH', status: 'ACTIVE', source: 'CONTACT_SIGNAL', notes: `Insider tip from ${companyName} contact` },
        { upsert: true, new: true }
      );
    }

    if (res) res.status(200).json({ topics });
  } catch (error) {
    if (res) res.status(500).json({ error: error.message });
    else console.error('Error in extractNetworkingSignals:', error);
  }
};

// DX9: PrepHub Signals
exports.processPrepHubCompletion = async (req, res) => {
  try {
    const { syllabusId } = req.body;
    const userId = req.user ? req.user.id : req.body.userId;

    const syllabus = await PrepSyllabus.findById(syllabusId);
    if (!syllabus) throw new Error('Syllabus not found');

    const topics = syllabus.topicsCovered || [];
    
    // Auto-create task to practice what they learned. We'll add this to weakness log for UI display.
    for (const topic of topics) {
      await DSAWeaknessLog.findOneAndUpdate(
        { userId, topic },
        { priority: 'MEDIUM', status: 'ACTIVE', source: 'LEARNING_REINFORCEMENT', notes: `Just completed PrepHub resource: ${syllabus.company}` },
        { upsert: true, new: true }
      );
    }

    if (res) res.status(200).json({ message: 'Learning pipeline triggered' });
  } catch (error) {
    if (res) res.status(500).json({ error: error.message });
    else console.error('Error in processPrepHubCompletion:', error);
  }
};

// DX10: Command Center Data
exports.getCommandCenterData = async (req, res) => {
  try {
    const userId = req.user.id;

    // We'd aggregate data across the 9 panels here. Mocking for speed.
    const data = {
      healthScore: 82,
      briefing: "Your DSA prep is on track for your Razorpay interview in 8 days. However your Graphs mastery (flagged by 2 JD analyses and 1 contact tip) needs immediate attention — you have 0 Graph problems logged.",
      panels: {
        resume: { status: 'GOOD', data: {} },
        applications: { status: 'WARNING', data: {} },
        interviews: { status: 'GOOD', data: {} },
        contests: { status: 'GOOD', data: {} },
        goals: { status: 'GOOD', data: {} },
        calendar: { status: 'WARNING', data: {} },
        networking: { status: 'URGENT', data: {} },
        offers: { status: 'GOOD', data: {} },
        prephub: { status: 'GOOD', data: {} }
      }
    };

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
