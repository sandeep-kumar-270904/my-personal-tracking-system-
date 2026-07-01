const OpeningRitualSession = require('../models/OpeningRitualSession');
const TalkWhileCodingSession = require('../models/TalkWhileCodingSession');
const StuckRecoveryAttempt = require('../models/StuckRecoveryAttempt');
const InterviewQuestionBank = require('../models/InterviewQuestionBank');
const SkillCalibrationLog = require('../models/SkillCalibrationLog');
const FollowUpDepthSession = require('../models/FollowUpDepthSession');
const TimeAllocationLog = require('../models/TimeAllocationLog');
const StoryNaturalnessScore = require('../models/StoryNaturalnessScore');
const ColdInterviewerSession = require('../models/ColdInterviewerSession');
const WrongAnswerRecoverySession = require('../models/WrongAnswerRecoverySession');
const InterviewSignalVocabulary = require('../models/InterviewSignalVocabulary');
const DetailCalibrationLog = require('../models/DetailCalibrationLog');
const PreInterviewProtocol = require('../models/PreInterviewProtocol');
const MemoryCaptureResponse = require('../models/MemoryCaptureResponse');

// POST /api/interviews/training/opening-ritual
exports.evalOpeningRitual = async (req, res) => {
  try {
    const { transcript, practiceType, timeToFirstWord, hesitationCount } = req.body;
    // Mock LLM Evaluation
    const fluencyScore = Math.floor(Math.random() * 20) + 70; // 70-90
    const feedbackText = "You introduced yourself well but never mentioned why you are interested in this specific company — always connect your background to the role.";
    
    const session = await OpeningRitualSession.create({
      userId: req.user.id,
      practiceType,
      transcript,
      timeToFirstWord,
      hesitationCount,
      fluencyScore,
      feedbackText
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/talk-while-coding
exports.evalTalkWhileCoding = async (req, res) => {
  try {
    const { transcript, silenceGaps, longestSilence, problemId } = req.body;
    const narrationQuality = Math.floor(Math.random() * 20) + 75;
    const codingAccuracy = 90;
    
    const session = await TalkWhileCodingSession.create({
      userId: req.user.id,
      problemId,
      transcript,
      silenceGaps,
      longestSilence,
      narrationQuality,
      codingAccuracy,
      feedbackText: "Try to explain your variables before you type them."
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/stuck-recovery
exports.evalStuckRecovery = async (req, res) => {
  try {
    const { studentResponse, recoveryStrategy } = req.body;
    const session = await StuckRecoveryAttempt.create({
      userId: req.user.id,
      studentResponse,
      recoveryStrategy,
      recoveryScore: 85,
      feedbackText: "Good pivot! Buying time with a brute force proposal is a solid professional move."
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/interviews/training/question-bank
exports.getQuestionBank = async (req, res) => {
  try {
    const { interviewerType } = req.query;
    const filter = { userId: req.user.id };
    if (interviewerType) filter.interviewerType = interviewerType;
    const questions = await InterviewQuestionBank.find(filter);
    res.json(questions);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/question-bank
exports.addQuestionToBank = async (req, res) => {
  try {
    const { question, interviewerType } = req.body;
    const q = await InterviewQuestionBank.create({
      userId: req.user.id,
      question,
      questionCategory: 'TECHNICAL_CULTURE', // MOCKED LLM Categorization
      interviewerType
    });
    res.status(201).json(q);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/skill-calibration
exports.logSkillCalibration = async (req, res) => {
  try {
    const { interviewId, skills } = req.body;
    const logs = await Promise.all(skills.map(s => SkillCalibrationLog.create({
      userId: req.user.id,
      interviewId,
      skillName: s.skillName,
      preInterviewConfidence: s.confidence
    })));
    res.status(201).json(logs);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// PATCH /api/interviews/training/skill-calibration/:interviewId
exports.updateSkillCalibration = async (req, res) => {
  try {
    const { skills } = req.body;
    const updated = [];
    for (let s of skills) {
      const log = await SkillCalibrationLog.findOneAndUpdate(
        { userId: req.user.id, interviewId: req.params.interviewId, skillName: s.skillName },
        { interviewerProbeDepth: s.interviewerProbeDepth, performedWell: s.performedWell, gapScore: s.performedWell ? 0 : -2 },
        { new: true }
      );
      if(log) updated.push(log);
    }
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/follow-up-depth
exports.evalFollowUpDepth = async (req, res) => {
  try {
    const { questionAsked, initialAnswer, followUpQuestion, followUpAnswer } = req.body;
    const session = await FollowUpDepthSession.create({
      userId: req.user.id,
      questionAsked, initialAnswer, followUpQuestion, followUpAnswer,
      depthScore: 80, reasoningClarity: 75, tradeoffMentioned: true,
      feedbackText: "You handled the depth well but missed a core trade-off around memory limits."
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/time-allocation
exports.logTimeAllocation = async (req, res) => {
  try {
    const session = await TimeAllocationLog.create({ userId: req.user.id, ...req.body, phaseAccuracy: 88 });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/story-naturalness
exports.evalStoryNaturalness = async (req, res) => {
  try {
    const session = await StoryNaturalnessScore.create({
      userId: req.user.id,
      ...req.body,
      naturalnesScore: 82,
      roboticPhrases: ["In this situation I was tasked with the responsibility of"],
      genuineMoments: ["It was a Friday evening and we had 2 hours until deployment"],
      paceScore: 90,
      feedbackText: "Try to sound less rehearsed at the beginning."
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/cold-simulation
exports.startColdSimulation = async (req, res) => {
  try {
    const session = await ColdInterviewerSession.create({
      userId: req.user.id,
      targetCompany: req.body.targetCompany,
      roundType: req.body.roundType,
      questionsAsked: ["What is the hardest bug you've ever tracked down?"],
      studentAnswers: []
    });
    res.status(201).json({ sessionId: session._id, nextQuestion: session.questionsAsked[0] });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/cold-simulation/:sessionId/answer
exports.answerColdSimulation = async (req, res) => {
  try {
    const session = await ColdInterviewerSession.findById(req.params.sessionId);
    session.studentAnswers.push(req.body.answer);
    session.questionsAsked.push("Explain how you would scale that solution.");
    session.composureScore = 85;
    session.performanceWithoutValidation = 90;
    await session.save();
    res.json({ nextQuestion: "Explain how you would scale that solution." });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/wrong-answer-recovery
exports.evalWrongAnswerRecovery = async (req, res) => {
  try {
    const session = await WrongAnswerRecoverySession.create({
      userId: req.user.id,
      ...req.body,
      recoveryScore: 80,
      feedbackText: "Good acknowledgement, but your pivot was slightly unstructured."
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/interviews/training/signal-vocabulary
exports.getSignalVocabulary = async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const signals = await InterviewSignalVocabulary.find(filter);
    res.json(signals);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/detail-calibration
exports.evalDetailCalibration = async (req, res) => {
  try {
    const session = await DetailCalibrationLog.create({
      userId: req.user.id,
      ...req.body,
      aiDepthAssessment: 'TOO_BRIEF',
      interviewerSimulatedReaction: "The interviewer immediately asked a follow-up because your answer felt incomplete — they needed more.",
      adjustmentMade: true
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/interviews/training/pre-interview-protocol
exports.getPreInterviewProtocol = async (req, res) => {
  try {
    const protocol = await PreInterviewProtocol.findOne({ userId: req.user.id }).sort('-createdAt');
    res.json(protocol || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/pre-interview-protocol/generate
exports.generatePreInterviewProtocol = async (req, res) => {
  try {
    const protocol = await PreInterviewProtocol.create({
      userId: req.user.id,
      protocolSteps: [
        { time: "Night before", action: "Solve 2 Easy problems in strongest topic", evidence: "Average performance 7.8 vs 6.1" },
        { time: "Night before", action: "Sleep by 11 PM", evidence: "All 8+ performances followed 7+ hour sleep" },
        { time: "Morning of", action: "No new DSA topics", evidence: "New topics correlate with 1.4 point drop" },
        { time: "2 hours before", action: "Review behavioral stories", evidence: "High ROI" }
      ]
    });
    res.status(201).json(protocol);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/memory-capture
exports.getMemoryCaptureQuestions = async (req, res) => {
  try {
    res.json([
      "What was the first technical question you were asked?",
      "At what point in the interview did you feel most confident and why?",
      "At what point did you feel least confident and what happened?",
      "What did the interviewer say or do that you want to remember?",
      "What is the one thing you would do differently?"
    ]);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/interviews/training/memory-capture/:interviewId/submit
exports.submitMemoryCapture = async (req, res) => {
  try {
    const session = await MemoryCaptureResponse.create({
      userId: req.user.id,
      interviewId: req.params.interviewId,
      responses: req.body.responses,
      qualityScore: 85
    });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/interviews/training/performance-dashboard
exports.getPerformanceDashboard = async (req, res) => {
  try {
    res.json({
      trainingReadinessScore: 78,
      mostImproved: ["Opening Ritual", "Stuck Recovery"],
      needsWork: ["Story Naturalness", "Talk While Coding"],
      recommendedTrainings: ["Talk While Coding", "Cold Interviewer"]
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
