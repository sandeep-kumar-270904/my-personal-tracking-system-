const Interview = require('../models/Interview');
const InterviewPrepChecklist = require('../models/InterviewPrepChecklist');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewPattern = require('../models/InterviewPattern');
const InterviewInsight = require('../models/InterviewInsight');
const MockInterview = require('../models/MockInterview');
const Application = require('../models/Application');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper for sending timeline events
const UnifiedTimeline = require('../models/UnifiedTimeline');
const logTimeline = async (userId, eventType, source, title, description, link) => {
  try {
    await UnifiedTimeline.create({
      userId,
      eventType,
      source,
      title,
      description,
      link,
      metadata: {}
    });
  } catch (err) {
    console.error('Timeline logging failed:', err.message);
  }
};

// GET /api/interviews
exports.getInterviews = async (req, res) => {
  try {
    const { status, outcome, company, roundType, search, sortBy = 'scheduledAt', sortOrder = 'desc' } = req.query;
    
    let query = { userId: req.user.id };
    if (status) query.status = status;
    if (outcome) query.outcome = outcome;
    if (company) query.company = { $regex: company, $options: 'i' };
    if (roundType) query.roundType = roundType;
    if (search) query.$or = [
      { company: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } }
    ];

    const sortOpt = {};
    sortOpt[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const interviews = await Interview.find(query)
      .populate('applicationId')
      .sort(sortOpt);
      
    // Calc stats
    const totalCount = interviews.length;
    const upcomingCount = interviews.filter(i => new Date(i.scheduledAt) > new Date()).length;
    const completed = interviews.filter(i => i.status === 'COMPLETED');
    const passed = completed.filter(i => i.outcome === 'PASSED').length;
    const conversionRate = completed.length ? (passed / completed.length) : 0;

    res.json({
      interviews,
      totalCount,
      upcomingCount,
      conversionRate
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/interviews
exports.createInterview = async (req, res) => {
  try {
    const { applicationId, company, role, round, roundType, scheduledAt, durationMinutes, platform, prepNotes, confidenceLevel } = req.body;
    
    const interview = await Interview.create({
      userId: req.user.id,
      applicationId,
      company,
      role,
      round,
      roundType: roundType || 'TECHNICAL',
      scheduledAt,
      durationMinutes,
      platform: platform || 'ZOOM',
      prepNotes,
      confidenceLevel,
      status: 'SCHEDULED',
      outcome: 'PENDING'
    });

    // Generate prep checklist
    let checklistItems = ['GOOD_SLEEP', 'LOGISTICS', 'RESUME_REVIEW'];
    if (roundType === 'TECHNICAL' || roundType === 'ONLINE_ASSESSMENT') {
      checklistItems.push('DSA_TOPICS');
    }
    if (roundType === 'SYSTEM_DESIGN') {
      checklistItems.push('SYSTEM_DESIGN');
    }
    if (roundType !== 'ONLINE_ASSESSMENT') {
      checklistItems.push('BEHAVIORAL_STORIES', 'MOCK_PRACTICE', 'COMPANY_RESEARCH');
    }

    const checklistPromises = checklistItems.map(type => 
      InterviewPrepChecklist.create({
        interviewId: interview._id,
        checklistType: type
      })
    );
    await Promise.all(checklistPromises);

    // Log to timeline
    await logTimeline(
      req.user.id,
      'INTERVIEW_SCHEDULED',
      'INTERVIEWS',
      `Interview Scheduled: ${company}`,
      `${role} - ${round} round on ${new Date(scheduledAt).toLocaleDateString()}`,
      `/interviews`
    );

    res.status(201).json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/interviews/:id
exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Handled in mongoose hooks: DSA extract, Resume extract.
    
    res.json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/:id
exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('applicationId');
      
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const checklist = await InterviewPrepChecklist.find({ interviewId: interview._id });
    const questions = await InterviewQuestion.find({ interviewId: interview._id });
    
    // Mocking contacts and events since they are outside scope of this model directly
    const contacts = []; 
    const timelineEvents = [];

    res.json({
      interview,
      checklist,
      questions,
      contacts,
      timelineEvents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/interviews/:id/debrief
exports.submitDebrief = async (req, res) => {
  try {
    const { debrief, questionsAsked, outcome, performanceRating, stressLevel, feedbackReceived, linkedinConnected } = req.body;
    
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        debrief, 
        outcome, 
        performanceRating, 
        stressLevel, 
        feedbackReceived, 
        linkedinConnected,
        status: 'COMPLETED'
      },
      { new: true }
    );

    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Store questions individually
    if (questionsAsked && Array.isArray(questionsAsked)) {
      const qPromises = questionsAsked.map(q => 
        InterviewQuestion.create({
          userId: req.user.id,
          interviewId: interview._id,
          company: interview.company,
          role: interview.role,
          roundType: interview.roundType,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          userAnswer: q.userAnswer,
          wasAnsweredWell: q.wasAnsweredWell
        })
      );
      await Promise.all(qPromises);
    }

    // Trigger Pattern Analysis asynchronously
    this.analyzePatterns({ user: req.user }, { json: () => {} }).catch(console.error);

    // Timeline event
    await logTimeline(
      req.user.id,
      'INTERVIEW_DEBRIEF',
      'INTERVIEWS',
      `Debrief Logged: ${interview.company}`,
      `Outcome: ${outcome}. Performance: ${performanceRating}/10`,
      `/interviews`
    );

    // Note: Mongoose save hook will trigger DSA and Resume signal extraction

    res.json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/:id/prep-brief
exports.getPrepBrief = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    if (interview.prepBrief && interview.prepBrief.length > 20) {
      // It's cached (assuming we stringified JSON)
      try {
        return res.json(JSON.parse(interview.prepBrief));
      } catch(e) {
        // Fallback to regenerate
      }
    }

    const prompt = `You are an elite interview prep coach. 
Generate a structured JSON prep brief for an interview at ${interview.company} for the role of ${interview.role}. Round type: ${interview.roundType}.
Provide output as raw JSON with the following structure:
{
  "technicalTopics": ["topic1", "topic2"],
  "behavioralQuestions": ["q1", "q2"],
  "systemDesignTopics": ["topic1"],
  "companySpecificTips": ["tip1", "tip2"],
  "formatExpectation": "string describing what to expect",
  "confidenceBoosters": ["You have a strong CS foundation", "You've built relevant projects"]
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

    interview.prepBrief = text;
    await interview.save();

    res.json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/stats
exports.getInterviewStats = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id });
    
    const totalInterviews = interviews.length;
    const completed = interviews.filter(i => i.status === 'COMPLETED');
    const passed = completed.filter(i => i.outcome === 'PASSED').length;
    const conversionRate = completed.length ? (passed / completed.length) : 0;
    
    const avgPerformanceRating = completed.reduce((acc, curr) => acc + (curr.performanceRating || 0), 0) / (completed.length || 1);
    const avgStressLevel = completed.reduce((acc, curr) => acc + (curr.stressLevel || 0), 0) / (completed.length || 1);
    const avgConfidenceLevel = interviews.reduce((acc, curr) => acc + (curr.confidenceLevel || 0), 0) / (totalInterviews || 1);
    
    const roundTypeBreakdown = {};
    const outcomeBreakdown = {};
    const companiesSet = new Set();
    
    interviews.forEach(i => {
      roundTypeBreakdown[i.roundType] = (roundTypeBreakdown[i.roundType] || 0) + 1;
      outcomeBreakdown[i.outcome] = (outcomeBreakdown[i.outcome] || 0) + 1;
      companiesSet.add(i.company);
    });

    res.json({
      totalInterviews,
      conversionRate,
      avgPerformanceRating,
      avgStressLevel,
      avgConfidenceLevel,
      roundTypeBreakdown,
      outcomeBreakdown,
      companiesInterviewed: companiesSet.size,
      fastestOffer: null, // Stub
      avgRoundsPerProcess: totalInterviews / (companiesSet.size || 1)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/patterns
exports.getPatterns = async (req, res) => {
  try {
    const patterns = await InterviewPattern.find({ userId: req.user.id });
    res.json(patterns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/insights
exports.getInsights = async (req, res) => {
  try {
    const insights = await InterviewInsight.find({ userId: req.user.id, isDismissed: false }).sort({ generatedAt: -1 });
    res.json(insights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/interviews/analyze-patterns
exports.analyzePatterns = async (req, res) => {
  try {
    const user = req.user;
    const interviews = await Interview.find({ userId: user.id });
    
    // We only analyze if they have a decent amount of interviews, but for dev we'll always run
    if (interviews.length < 1) {
      if (res && res.json) return res.json({ message: 'Not enough data' });
      return;
    }

    const prompt = `You are an elite interview analyst. Based on this student's interview history, generate an array of insights (STRENGTH, WEAKNESS, PATTERN, IMPROVEMENT, MILESTONE) and an array of patterns (ALWAYS_ASKED_DSA, SYSTEM_DESIGN_HEAVY, etc).
    Interview Data: ${JSON.stringify(interviews.map(i => ({ company: i.company, roundType: i.roundType, outcome: i.outcome, performanceRating: i.performanceRating, stressLevel: i.stressLevel })))}
    Respond with raw JSON:
    {
      "insights": [{ "insightType": "STRENGTH", "content": "insight text" }],
      "patterns": [{ "patternType": "ALWAYS_ASKED_DSA", "company": "company name" }]
    }`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const data = JSON.parse(text);

    // Wipe old non-dismissed insights and patterns for a clean slate, or just add them?
    // Let's just add new ones. We could add logic to dedup.
    
    for (const p of (data.patterns || [])) {
      await InterviewPattern.create({
        userId: user.id,
        patternType: p.patternType,
        company: p.company,
        evidence: []
      });
    }

    for (const i of (data.insights || [])) {
      await InterviewInsight.create({
        userId: user.id,
        insightType: i.insightType,
        content: i.content,
        evidence: []
      });
    }

    if (res && res.json) res.json({ message: 'Analysis complete' });
  } catch (error) {
    console.error(error);
    if (res && res.status) res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/question-bank
exports.getQuestionBank = async (req, res) => {
  try {
    const questions = await InterviewQuestion.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/interviews/mock
exports.createMockSession = async (req, res) => {
  try {
    const { targetCompany, targetRole, roundType, conductedWith } = req.body;
    
    // In a real flow, we'd query past questions for this company. 
    // Here we'll generate some relevant questions using LLM.
    const prompt = `Generate 3 interview questions for a mock interview at ${targetCompany} for ${targetRole} (${roundType} round). Respond with raw JSON array of objects: { "question": "text", "category": "TECHNICAL", "difficulty": "MEDIUM" }`;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const generatedQuestions = JSON.parse(text);

    const mock = await MockInterview.create({
      userId: req.user.id,
      targetCompany,
      targetRole,
      roundType,
      conductedWith,
      questionsUsed: generatedQuestions
    });

    res.status(201).json(mock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/upcoming
exports.getUpcoming = async (req, res) => {
  try {
    const upcoming = await Interview.find({ 
      userId: req.user.id,
      scheduledAt: { $gte: new Date() }
    }).sort({ scheduledAt: 1 }).limit(5);

    // Need to fetch prep checklist % for each
    const upcWithPrep = await Promise.all(upcoming.map(async (u) => {
      const checks = await InterviewPrepChecklist.find({ interviewId: u._id });
      const comp = checks.filter(c => c.isCompleted).length;
      const pct = checks.length ? Math.round((comp / checks.length) * 100) : 0;
      return { ...u.toObject(), prepPercent: pct };
    }));

    res.json(upcWithPrep);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/interviews/timeline
exports.getTimeline = async (req, res) => {
  try {
    // This aggregates multiple events
    const timelineEvents = await UnifiedTimeline.find({ userId: req.user.id, source: 'INTERVIEWS' }).sort({ createdAt: -1 });
    res.json(timelineEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
