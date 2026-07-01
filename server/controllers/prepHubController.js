const PrepSyllabus = require('../models/PrepSyllabus');
const Application = require('../models/Application');
const DSA = require('../models/DSA');

// @desc    Get upcoming interview prep syllabuses
// @route   GET /api/prephub/syllabus
// @access  Private
const getSyllabuses = async (req, res) => {
  try {
    const syllabuses = await PrepSyllabus.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(syllabuses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Generate syllabus (called internally or via endpoint)
// @route   POST /api/prephub/generate/:appId
// @access  Private
const generateSyllabusInternal = async (appId, userId) => {
  const application = await Application.findById(appId);
  if (!application || application.userId.toString() !== userId.toString()) return null;

  let syllabus = await PrepSyllabus.findOne({ applicationId: appId });
  if (syllabus) return syllabus;

  const dsaHistory = await DSA.find({ user: userId });
  const weakTopicsMap = {};
  dsaHistory.forEach(item => {
    if (item.confidence < 3) {
      if (!weakTopicsMap[item.topic]) weakTopicsMap[item.topic] = 0;
      weakTopicsMap[item.topic]++;
    }
  });

  const weakTopics = Object.keys(weakTopicsMap)
    .sort((a, b) => weakTopicsMap[b] - weakTopicsMap[a])
    .slice(0, 3)
    .map(topic => ({ topic, reason: 'Identified as a weak area in your DSA tracker' }));

  if (weakTopics.length === 0) {
    weakTopics.push({ topic: 'Graphs', reason: 'Commonly asked in ' + application.company });
    weakTopics.push({ topic: 'Dynamic Programming', reason: 'High frequency for ' + application.role + ' roles' });
  }

  const recommendedProblems = [
    { title: `Two Sum (${application.company} variant)`, difficulty: 'Easy', link: 'https://leetcode.com/problems/two-sum/' },
    { title: `LRU Cache`, difficulty: 'Medium', link: 'https://leetcode.com/problems/lru-cache/' },
    { title: `Merge Intervals`, difficulty: 'Medium', link: 'https://leetcode.com/problems/merge-intervals/' }
  ];

  const behavioralQuestions = [
    { question: `Tell me about a time you faced a technical challenge while working on a ${application.role} project.`, valueTested: 'Problem Solving' },
    { question: `Why do you want to join ${application.company}?`, valueTested: 'Cultural Fit' },
    { question: `Describe a conflict you had with a teammate. How did you resolve it?`, valueTested: 'Teamwork' }
  ];

  return await PrepSyllabus.create({
    userId,
    applicationId: appId,
    company: application.company,
    role: application.role,
    dsaTopics: weakTopics,
    recommendedProblems,
    behavioralQuestions
  });
};

const generateSyllabus = async (req, res) => {
  try {
    const { appId } = req.params;
    const application = await Application.findById(appId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'User not authorized' });
    
    const syllabus = await generateSyllabusInternal(appId, req.user._id);
    res.status(201).json(syllabus);
  } catch (error) {
    console.error("Generate Syllabus Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const alerts = await PrepSyllabus.find({ userId: req.user._id, isCompleted: false }).sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getSyllabuses,
  generateSyllabus,
  generateSyllabusInternal,
  getAlerts
};
