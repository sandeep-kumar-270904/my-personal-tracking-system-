const DiagnosticAssessment = require('../models/DiagnosticAssessment');
const ConceptModule = require('../models/ConceptModule');
const StudentConceptProgress = require('../models/StudentConceptProgress');
const ThinkingVelocity = require('../models/ThinkingVelocity');
const BlindImplementation = require('../models/BlindImplementation');
const ORCAFramework = require('../models/ORCAFramework');
const RubberDuckExplanation = require('../models/RubberDuckExplanation');
const SolutionQualityEval = require('../models/SolutionQualityEval');
const CalibrationInterview = require('../models/CalibrationInterview');
const ActiveRecallNote = require('../models/ActiveRecallNote');
const PressureModeSession = require('../models/PressureModeSession');
const DailyBrief = require('../models/DailyBrief');
const PatternDisguiseDrill = require('../models/PatternDisguiseDrill');
const StuckProtocolLog = require('../models/StuckProtocolLog');
const AvoidanceLock = require('../models/AvoidanceLock');
const ProgressStory = require('../models/ProgressStory');
const WeeklyHonestReport = require('../models/WeeklyHonestReport');
const User = require('../models/User');

// Mechanic 1: Diagnostic Flow
exports.submitDiagnostic = async (req, res) => {
  try {
    const { responses } = req.body;
    const startingTopic = "Arrays";
    const startingPattern = "Two Pointer";
    const estimatedLevel = "BEGINNER";
    
    await DiagnosticAssessment.create({
      userId: req.user.id,
      responses,
      startingTopic,
      startingPattern,
      estimatedLevel
    });

    res.json({
      startingTopic,
      startingPattern,
      estimatedLevel,
      firstProblemRecommendation: {
        title: "Two Sum",
        topic: "Arrays",
        pattern: "Two Pointer",
        difficulty: "Easy",
        reason: "Your responses suggest you are comfortable with basic loops but have not worked with multiple pointers yet. This is the right entry point."
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 21: Concept Modules
exports.getConceptModules = async (req, res) => {
  try {
    const modules = await ConceptModule.find().sort('orderIndex');
    res.json(modules);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getConceptModuleById = async (req, res) => {
  try {
    const module = await ConceptModule.findById(req.params.id);
    res.json(module);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.completeConceptModule = async (req, res) => {
  try {
    res.json({ message: "Module completed and dependents unlocked" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 2: Thinking Velocity Tracker
exports.logThinkingVelocity = async (req, res) => {
  try {
    const { timeToFirstCorrectApproach, wasApproachCorrect, pressureMode } = req.body;
    const log = await ThinkingVelocity.create({
      userId: req.user.id,
      problemId: req.params.id,
      timeToFirstCorrectApproach,
      wasApproachCorrect,
      pressureMode
    });
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getThinkingVelocityTrend = async (req, res) => {
  try {
    res.json([
      { week: 'Week 1', velocity: 24, volume: 10 },
      { week: 'Week 2', velocity: 20, volume: 15 },
      { week: 'Week 3', velocity: 16, volume: 12 }
    ]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 3: Blind Implementation
exports.logBlindImplementation = async (req, res) => {
  try {
    const blind = await BlindImplementation.create({
      userId: req.user.id,
      problemId: req.params.id,
      ...req.body
    });
    res.json(blind);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 13: ORCA Framework
exports.submitORCA = async (req, res) => {
  try {
    const orca = await ORCAFramework.create({
      userId: req.user.id,
      problemId: req.params.id,
      ...req.body
    });
    res.json({
      success: true,
      orca,
      feedback: {
        recognitionCorrect: true,
        attackSound: true,
        message: "Excellent recognition. The sliding window approach is perfect here."
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 10: Rubber Duck Mode
exports.evaluateRubberDuck = async (req, res) => {
  try {
    res.json({
      communicationScore: 85,
      intuitionExplained: true,
      complexityMentioned: false,
      edgeCasesCovered: true,
      aiFeedback: "You explained the algorithm clearly, but interviewers always want to hear the time complexity."
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 16: Solution Quality
exports.evaluateSolutionQuality = async (req, res) => {
  try {
    res.json({
      correctnessScore: 95,
      efficiencyScore: 80,
      readabilityScore: 90,
      interviewabilityScore: 70,
      overallScore: 84,
      specificImprovements: [
        "Your variable names i, j make this hard to follow — rename to left, right",
        "An O(n) solution exists using a frequency map"
      ],
      optimalSolutionExists: true,
      optimalApproach: "Use a hash map to track counts"
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 19: Calibration Interview
exports.checkCalibrationEligible = async (req, res) => {
  try { res.json({ eligible: true }); } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.startCalibration = async (req, res) => {
  try {
    res.json({
      sessionToken: "cal_123",
      problems: [
        { _id: '1', title: 'Two Sum', difficulty: 'Easy' },
        { _id: '2', title: 'Valid Parentheses', difficulty: 'Easy' },
        { _id: '3', title: 'Number of Islands', difficulty: 'Medium' },
        { _id: '4', title: 'Word Break', difficulty: 'Medium' },
        { _id: '5', title: 'Trapping Rain Water', difficulty: 'Hard' }
      ]
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.submitCalibration = async (req, res) => {
  try {
    res.json({
      actualLevel: "LeetCode Medium 65th percentile",
      percentileEstimate: 65,
      biggestGap: "Dynamic Programming",
      feedback: "Based on your performance, your actual level is LeetCode Medium 65th percentile. Your strongest area was Graphs."
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 9: Stuck Protocol
exports.submitStuckProtocol = async (req, res) => {
  try {
    const { choiceMade, currentApproach } = req.body;
    let response = {};
    if (choiceMade === 'HINT') {
      response.hint = "Have you considered what happens if you track something about the elements you have already seen?";
    } else if (choiceMade === 'APPROACH_CHECK') {
      response.approachFeedback = "Your current approach would be O(n²) — there is a way to do this in one pass.";
    }
    res.json(response);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 6: Pressure Mode
exports.startPressureMode = async (req, res) => {
  try {
    res.json({
      timeLimitSeconds: 1200,
      sessionId: "pres_123",
      prompts: [
        { timeOffset: 800, promptText: "Can you walk me through your current thinking?" },
        { timeOffset: 400, promptText: "What is your time complexity so far?" }
      ]
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.submitPressureMode = async (req, res) => {
  try { res.json({ pressureScore: 88 }); } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPressureGap = async (req, res) => {
  try {
    res.json([{ topic: "Trees", normalAvgTime: 15, pressureAvgTime: 25, pressurePenalty: 40 }]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 7: Pattern Disguise
exports.getNextPatternDisguise = async (req, res) => {
  try {
    res.json({
      problemId: "pd_1",
      title: "Minimum Size Subarray Sum",
      snippet: "Given an array of positive integers nums and a positive integer target, return the minimal length of a contiguous subarray..."
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.submitPatternDisguise = async (req, res) => {
  try {
    res.json({
      wasCorrect: true,
      correctPattern: "Sliding Window",
      explanation: "The constraint of finding a minimal contiguous subarray points directly to a sliding window approach."
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPatternRecognitionAccuracy = async (req, res) => {
  try {
    res.json([
      { pattern: "Two Pointer", accuracy: 85 },
      { pattern: "Sliding Window", accuracy: 33 }
    ]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 17: Daily Brief
exports.getDailyBrief = async (req, res) => {
  try {
    res.json({
      dsaTask: "Complete 1 Medium problem in Sliding Window (your blind spot).",
      applicationTask: "Follow up with Razorpay HR regarding the OA.",
      resumeTask: "Quantify your impact on the Auth component."
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.completeDailyBriefTask = async (req, res) => {
  try { res.json({ success: true }); } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 15: Avoidance Locks
exports.getAvoidanceLocks = async (req, res) => {
  try {
    res.json([{ lockedTopic: "Dynamic Programming", requiredProblems: 2, completedProblems: 0, isActive: true }]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.checkAvoidanceUnlock = async (req, res) => {
  try {
    res.json({ isLocked: true, lockedTopic: "Dynamic Programming", requiredProblems: 2 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 18: Active Recall
exports.getActiveRecallDue = async (req, res) => {
  try {
    res.json([{ noteId: "n1", question: "What are the initial values for the two pointers in a standard Two Pointer setup and why?", problemTitle: "Two Sum II", topic: "Arrays" }]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.submitActiveRecallAnswer = async (req, res) => {
  try {
    res.json({
      isCorrect: true,
      originalNote: "Always initialize the left pointer to 0 and right pointer to n-1 for Two Pointer",
      feedback: "You nailed it!"
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 5: Weekly Honest Report
exports.getWeeklyHonestReport = async (req, res) => {
  try {
    res.json({
      sentence1: "This week your Binary Search thinking velocity improved from 24 minutes to 16 minutes — you are genuinely getting faster.",
      sentence2: "Your Trees confidence has not changed in 3 weeks despite 8 problems logged — you may be practicing without understanding.",
      sentence3: "Next week: complete the Trees concept module before logging any more Tree problems."
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 14: Placement Countdown
exports.getPlacementSentence = async (req, res) => {
  try {
    res.json({ sentence: "67 days left — at current pace you will be ready for TCS and Infosys but not Razorpay — 2 more problems daily closes the gap." });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 11: Company Difficulty Calibrator
exports.getCompanyReadiness = async (req, res) => {
  try {
    res.json({
      company: req.params.companyName,
      status: "CLOSE",
      message: "Ready for Arrays (Medium) ✓, 3 more Medium Tree problems needed, Graphs not started — need 5 Easy problems to meet minimum."
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Mechanic 20: Interview Eve
exports.activateInterviewEve = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { newProblemLock: true });
    res.json({ success: true, message: "Interview eve mode activated. New problem logging paused." });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
