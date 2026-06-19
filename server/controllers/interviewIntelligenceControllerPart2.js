
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
