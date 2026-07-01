
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
