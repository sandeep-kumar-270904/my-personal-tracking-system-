const { GoogleGenerativeAI } = require('@google/generative-ai');
const StudyPlan = require('../models/StudyPlan');
const gamificationService = require('../services/gamificationService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generatePlan = async (req, res) => {
  try {
    const { goal, timelineWeeks, hoursPerDay, preferences } = req.body;
    const userId = req.user.id;

    // Check if user already has an active plan
    const existing = await StudyPlan.findOne({ userId, isActive: true });
    if (existing) {
      return res.status(400).json({ message: 'You already have an active study plan. Please complete or delete it first.' });
    }

    const prompt = `Generate a structured study plan for a student.
Goal: ${goal}
Timeline: ${timelineWeeks} weeks
Hours per day available: ${hoursPerDay}
Preferences: ${preferences.join(', ')}

Return ONLY a valid JSON array of weeks, where each week has a "week" number, a "focus" string (main topic), and an array of "tasks". Each task should have a "title" and a short "description".
Example format:
[
  {
    "week": 1,
    "focus": "Basics of Data Structures",
    "tasks": [
      { "title": "Arrays & Strings", "description": "Solve 5 easy problems on Arrays" },
      ...
    ]
  }
]
No markdown wrapping, just the raw JSON.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let aiText = result.response.text().trim();
    
    // Clean up potential markdown wrapper
    if (aiText.startsWith('\`\`\`json')) aiText = aiText.replace(/\`\`\`json/g, '');
    if (aiText.startsWith('\`\`\`')) aiText = aiText.replace(/\`\`\`/g, '');
    aiText = aiText.trim();

    const planData = JSON.parse(aiText);

    const studyPlan = await StudyPlan.create({
      userId,
      goal,
      timelineWeeks,
      hoursPerDay,
      preferences,
      plan: planData
    });

    res.status(201).json(studyPlan);
  } catch (error) {
    console.error('Study Plan Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate study plan' });
  }
};

const getMyPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await StudyPlan.findOne({ userId, isActive: true });
    res.json(plan || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const completeTask = async (req, res) => {
  try {
    const { planId, weekNumber, taskId } = req.params;
    const { completed } = req.body;
    const userId = req.user.id;

    const plan = await StudyPlan.findOne({ _id: planId, userId });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const week = plan.plan.find(w => w.week === parseInt(weekNumber));
    if (!week) return res.status(404).json({ message: 'Week not found' });

    const task = week.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.completed = completed;
    await plan.save();

    // Trigger gamification check for "consistent_planner" badge
    gamificationService.checkAndAwardBadges(userId).catch(console.error);

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    await StudyPlan.findOneAndDelete({ _id: planId, userId: req.user.id });
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  generatePlan,
  getMyPlan,
  completeTask,
  deletePlan
};
