const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const DSA = require('../models/DSA');
const DSATopic = require('../models/DSATopic');
const DSAPatternMastery = require('../models/DSAPatternMastery');
const DSAStudySession = require('../models/DSAStudySession');
const DSAWeaknessLog = require('../models/DSAWeaknessLog');
const DSABehaviorAnalysis = require('../models/DSABehaviorAnalysis');
const ContestDSACorrelation = require('../models/ContestDSACorrelation');
const StudyGroup = require('../models/StudyGroup');
const StudyGroupMember = require('../models/StudyGroupMember');
const StudyGroupActivity = require('../models/StudyGroupActivity');
const DSAMistake = require('../models/DSAMistake');
const InterviewDSASignal = require('../models/InterviewDSASignal');
const DSACurriculum = require('../models/DSACurriculum');
const crypto = require('crypto');

// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// D9: Behavioral pattern analyzer
exports.analyzeBehavior = async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentProblems = await DSA.find({ userId, solvedAt: { $gte: thirtyDaysAgo } });
    const fourteenDayProblems = recentProblems.filter(p => new Date(p.solvedAt) >= fourteenDaysAgo);
    const weaknesses = await DSAWeaknessLog.find({ userId, status: 'ACTIVE' }).sort({ priority: 1 }).limit(3);

    const patterns = [];
    const insights = [];

    // Avoidance Pattern
    if (weaknesses.length > 0) {
      const topWeakTopics = weaknesses.map(w => w.topic);
      const practicedTopics = [...new Set(fourteenDayProblems.map(p => p.topic))];
      const avoided = topWeakTopics.filter(t => !practicedTopics.includes(t));
      if (avoided.length > 0) {
        patterns.push({
          patternName: 'AVOIDANCE',
          severity: 'HIGH',
          description: `Consistently skipping weak topics: ${avoided.join(', ')}`,
          insight: `You have avoided ${avoided.join(', ')} for 14 days despite it being a top weakness.`,
          actionableAdvice: `Do 1 easy problem in ${avoided[0]} today to break the avoidance.`
        });
      }
    }

    // Easy Grinding
    if (fourteenDayProblems.length > 10) {
      const easyCount = fourteenDayProblems.filter(p => p.difficulty === 'EASY').length;
      if (easyCount / fourteenDayProblems.length > 0.7) {
        patterns.push({
          patternName: 'EASY_GRINDING',
          severity: 'MEDIUM',
          description: `Logging many easy problems (${Math.round((easyCount / fourteenDayProblems.length) * 100)}%)`,
          insight: 'You are grinding easy problems without challenging yourself.',
          actionableAdvice: 'Attempt at least one Medium problem in your next session.'
        });
      }
    }

    // Speed Rushing
    const rushingProblems = fourteenDayProblems.filter(p => {
      if (!p.timeToSolve) return false;
      if (p.difficulty === 'EASY' && p.timeToSolve < 8) return true;
      if (p.difficulty === 'MEDIUM' && p.timeToSolve < 15) return true;
      return false;
    });
    if (rushingProblems.length > 3) {
      patterns.push({
        patternName: 'SPEED_RUSHING',
        severity: 'MEDIUM',
        description: `Solved ${rushingProblems.length} problems unusually fast.`,
        insight: 'Your solve times are below expected minimums, suggesting you might be looking up solutions.',
        actionableAdvice: 'Spend at least 15 minutes struggling with a problem before looking at hints.'
      });
    }

    const analysis = await DSABehaviorAnalysis.create({
      userId,
      behaviorPatterns: patterns,
      insights
    });

    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D10: Contest to DSA correlation engine
exports.analyzeContestPerformance = async (req, res) => {
  try {
    const { contestId, attemptedProblems } = req.body; // e.g., [{title: 'Max Array', solved: true, timeTaken: 20}]
    const userId = req.user.id;

    // Call LLM to map attemptedProblems to patterns and topics
    const prompt = `Analyze these competitive programming problems: ${JSON.stringify(attemptedProblems)}. For each, provide the likely DSA topic and pattern tags. Return JSON like [{"title": "...", "topic": "Arrays", "patternTags": ["Sliding Window"]}].`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    const mappedProblems = JSON.parse(text);

    let solvedCount = 0;
    const topicsTested = [];
    const patternsTested = [];

    attemptedProblems.forEach(p => {
      if (p.solved) solvedCount++;
      const mapped = mappedProblems.find(m => m.title === p.title);
      if (mapped) {
        topicsTested.push(mapped.topic);
        patternsTested.push(...(mapped.patternTags || []));
      }
    });

    // We skip actual snapshotting for brevity, assuming standard mock logic
    const performanceScore = Math.round((solvedCount / attemptedProblems.length) * 100);

    const correlation = await ContestDSACorrelation.create({
      userId,
      contestId,
      problemsSolvedInContest: solvedCount,
      topicsTestedInContest: [...new Set(topicsTested)],
      patternsTestedInContest: [...new Set(patternsTested)],
      performanceScore,
      masteryPredictionAccuracy: 85 // Mocked for simplicity
    });

    res.status(200).json(correlation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D11: Long term mastery arc projector
exports.getTrajectory = async (req, res) => {
  try {
    const userId = req.user.id;
    // Current practice rate (problems per day over last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const recentProblems = await DSA.countDocuments({ userId, solvedAt: { $gte: fourteenDaysAgo } });
    const practiceRate = recentProblems / 14;

    // Just mocking calculations for the projector
    const currentReadiness = 40;
    const projectedState30Days = { readinessScore: Math.min(100, currentReadiness + practiceRate * 10), problemsSolved: recentProblems * 2 };
    const projectedState60Days = { readinessScore: Math.min(100, currentReadiness + practiceRate * 20), problemsSolved: recentProblems * 4 };
    const projectedState90Days = { readinessScore: Math.min(100, currentReadiness + practiceRate * 30), problemsSolved: recentProblems * 6 };

    res.status(200).json({
      currentPracticeRate: practiceRate,
      projectedState30Days,
      projectedState60Days,
      projectedState90Days,
      onTrackForPlacement: projectedState90Days.readinessScore > 80,
      daysToReady: 45,
      requiredDailyPractice: 3
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D12: Collaborative study groups
exports.createStudyGroup = async (req, res) => {
  try {
    const { groupName, displayName } = req.body;
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const group = await StudyGroup.create({
      groupName,
      inviteCode,
      createdBy: req.user.id,
      isPublic: true
    });

    await StudyGroupMember.create({
      groupId: group._id,
      userId: req.user.id,
      displayName: displayName || `Coder${Math.floor(Math.random() * 1000)}`
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.joinStudyGroup = async (req, res) => {
  try {
    const { inviteCode, displayName } = req.body;
    const group = await StudyGroup.findOne({ inviteCode });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const member = await StudyGroupMember.create({
      groupId: group._id,
      userId: req.user.id,
      displayName: displayName || `Coder${Math.floor(Math.random() * 1000)}`
    });

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudyGroupLeaderboard = async (req, res) => {
  try {
    const members = await StudyGroupMember.find({ groupId: req.params.id });
    // Mocking leaderboard
    const leaderboard = members.map(m => ({
      displayName: m.displayName,
      problemsThisWeek: Math.floor(Math.random() * 20),
      streak: Math.floor(Math.random() * 10)
    })).sort((a, b) => b.problemsThisWeek - a.problemsThisWeek);

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudyGroupActivity = async (req, res) => {
  try {
    const activity = await StudyGroupActivity.find({ groupId: req.params.id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D13: Problem difficulty calibrator
exports.getDifficultyCalibration = async (req, res) => {
  try {
    const problems = await DSA.find({ userId: req.user.id, personalDifficulty: { $ne: null } });
    
    const calibrationMap = problems.map(p => ({
      id: p._id,
      title: p.title,
      topic: p.topic,
      officialDifficulty: p.difficulty,
      personalDifficulty: p.personalDifficulty
    }));

    res.status(200).json(calibrationMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D14: Mistake pattern library
exports.logMistake = async (req, res) => {
  try {
    const { problemId, mistakeTypes, mistakeDescription, correctionInsight } = req.body;
    const mistake = await DSAMistake.create({
      userId: req.user.id,
      problemId,
      mistakeTypes,
      mistakeDescription,
      correctionInsight
    });
    res.status(201).json(mistake);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMistakePatterns = async (req, res) => {
  try {
    const mistakes = await DSAMistake.find({ userId: req.user.id });
    
    // Aggregate by type
    const types = {};
    mistakes.forEach(m => {
      m.mistakeTypes.forEach(t => {
        types[t] = (types[t] || 0) + 1;
      });
    });

    res.status(200).json({
      typeDistribution: types,
      recentMistakes: mistakes.slice(-10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D15: DSA knowledge decay detection
exports.calculateDecay = async (req, res) => {
  try {
    // Cron logic - for simplicity we update for the specific user
    const userId = req.user ? req.user.id : req.body.userId;
    const topics = await DSATopic.find({ userId });
    
    const now = new Date();
    for (let topic of topics) {
      if (!topic.lastPracticed) continue;
      const daysSince = Math.floor((now - new Date(topic.lastPracticed)) / (1000 * 60 * 60 * 24));
      
      if (daysSince > 14) {
        let decayRate = 4;
        if (topic.masteryLevel === 'MASTERED') decayRate = 2;
        if (topic.masteryLevel === 'ADVANCED') decayRate = 3;

        let decay = (daysSince - 14) * decayRate;
        topic.decayScore = Math.min(40, decay); // cap at 40
        await topic.save();
      }
    }

    res.status(200).json({ message: 'Decay calculated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D16: DSA interview debrief integration
exports.extractDSASignals = async (req, res) => {
  try {
    // Actually we could fetch the interview debrief here, but let's mock the text
    const { debriefText } = req.body;
    const interviewId = req.params.id;
    const userId = req.user.id;

    const prompt = `Extract DSA specific signals from this interview debrief: "${debriefText}". 
    Return a JSON object: { "dsaTopicsAsked": [], "patternsAsked": [], "struggledAreas": [], "excelledAreas": [], "interviewerFeedback": "string", "difficulty": "MEDIUM" }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    const data = JSON.parse(text);

    const signal = await InterviewDSASignal.create({
      userId,
      interviewId,
      ...data
    });

    res.status(200).json(signal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// D17: Personalized DSA curriculum generator
exports.generateCurriculum = async (req, res) => {
  try {
    const { targetCompanies, placementDeadline, availableHoursPerWeek } = req.body;
    const userId = req.user.id;

    const prompt = `Generate a 4 week DSA curriculum for target companies: ${targetCompanies.join(', ')}. 
    Return a JSON object with 'weeklyPlan' array, each object having { weekNumber, focusTopic, secondaryTopic, weeklyMilestone }.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    const data = JSON.parse(text);

    const curr = await DSACurriculum.create({
      userId,
      targetCompanies,
      weeklyPlan: data.weeklyPlan,
      currentWeek: 1
    });

    res.status(201).json(curr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurriculum = async (req, res) => {
  try {
    const curr = await DSACurriculum.findOne({ userId: req.user.id, isActive: true });
    res.status(200).json(curr || { weeklyPlan: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.recalibrateCurriculum = async (req, res) => {
  try {
    // Just mock recalibration
    const curr = await DSACurriculum.findOne({ userId: req.user.id, isActive: true });
    if (curr) {
      curr.weeklyPlan[curr.currentWeek].focusTopic += ' (Recalibrated)';
      await curr.save();
    }
    res.status(200).json(curr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
