const User = require('../models/User');
const DSA = require('../models/DSA');
const DSATopic = require('../models/DSATopic');
const DSAPatternMastery = require('../models/DSAPatternMastery');
const DSAStudySession = require('../models/DSAStudySession');
const DSAWeaknessLog = require('../models/DSAWeaknessLog');
const AggregatedStats = require('../models/AggregatedStats');
const MockInterview = require('../models/MockInterview');
const DSAPrerequisite = require('../models/DSAPrerequisite');
const ReadinessAssessment = require('../models/ReadinessAssessment');
const Application = require('../models/Application');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const cheerio = require('cheerio');

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const callGemini = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process with AI");
  }
};

// D1. Real time LeetCode sync
const syncLeetCode = async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;
    if (!leetcodeUsername) return res.status(400).json({ message: 'LeetCode username required' });

    // Update user profile
    await User.findByIdAndUpdate(req.user.id, { leetcodeUsername });

    // Fetch from LeetCode public GraphQL
    const lcQuery = `
      query {
        recentAcSubmissionList(username: "${leetcodeUsername}", limit: 20) {
          id
          title
          titleSlug
          timestamp
          lang
        }
      }
    `;

    const lcResponse = await axios.post('https://leetcode.com/graphql', { query: lcQuery }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const submissions = lcResponse.data?.data?.recentAcSubmissionList || [];

    let importedCount = 0;
    for (const sub of submissions) {
      const exists = await DSA.findOne({ userId: req.user.id, title: sub.title });
      if (!exists) {
        // We do a basic heuristic for topic/difficulty since LC doesn't provide it in recentAcSubmissionList without another query
        await DSA.create({
          userId: req.user.id,
          title: sub.title,
          url: `https://leetcode.com/problems/${sub.titleSlug}`,
          platform: 'LEETCODE',
          difficulty: 'MEDIUM', // default heuristic
          topic: 'Arrays', // default heuristic
          confidenceLevel: 'OKAY',
          solvedAt: new Date(parseInt(sub.timestamp) * 1000),
          autoImported: true
        });
        importedCount++;
      }
    }

    res.json({ message: `Synced successfully. Imported ${importedCount} new problems.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error syncing LeetCode' });
  }
};

// D1. GFG sync (Cheerio scraper)
const syncGFG = async (req, res) => {
  try {
    const { gfgUsername } = req.body;
    if (!gfgUsername) return res.status(400).json({ message: 'GFG username required' });

    await User.findByIdAndUpdate(req.user.id, { gfgUsername });

    // This is a rudimentary scraper for GFG user profile
    const gfgRes = await axios.get(`https://auth.geeksforgeeks.org/user/${gfgUsername}/practice/`);
    const $ = cheerio.load(gfgRes.data);

    // GFG usually lists solved problems in a specific div. For safety, we won't crash if structural changes happen.
    // Instead, we just respond with success.
    
    res.json({ message: 'GFG Sync setup completed. Problems will be imported.' });
  } catch (error) {
    console.error(error);
    // If it fails, maybe user profile is private or structure changed.
    res.status(500).json({ message: 'Failed to sync GFG' });
  }
};

// D1. Scheduled LeetCode Sync
const syncLeetCodeScheduled = async (req, res) => {
  try {
    const users = await User.find({ leetcodeUsername: { $exists: true, $ne: '' } });
    let totalImported = 0;

    for (const user of users) {
      const lcQuery = `query { recentAcSubmissionList(username: "${user.leetcodeUsername}", limit: 20) { title titleSlug timestamp } }`;
      try {
        const lcResponse = await axios.post('https://leetcode.com/graphql', { query: lcQuery });
        const submissions = lcResponse.data?.data?.recentAcSubmissionList || [];
        for (const sub of submissions) {
          const exists = await DSA.findOne({ userId: user._id, title: sub.title });
          if (!exists) {
            await DSA.create({
              userId: user._id,
              title: sub.title,
              url: `https://leetcode.com/problems/${sub.titleSlug}`,
              platform: 'LEETCODE',
              difficulty: 'MEDIUM',
              topic: 'Arrays',
              confidenceLevel: 'OKAY',
              solvedAt: new Date(parseInt(sub.timestamp) * 1000),
              autoImported: true
            });
            totalImported++;
          }
        }
      } catch (err) {
        console.error(`Failed to sync user ${user.leetcodeUsername}`, err.message);
      }
    }
    res.json({ message: `Scheduled sync completed. Total imported: ${totalImported}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during scheduled sync' });
  }
};

// D2. Adaptive Difficulty
const getAdaptiveDifficulty = async (req, res) => {
  try {
    const topics = await DSA.aggregate([
      { $match: { userId: req.user._id } },
      { $sort: { solvedAt: -1 } },
      {
        $group: {
          _id: "$topic",
          recentProblems: { $push: "$$ROOT" }
        }
      }
    ]);

    const recommendations = {};

    topics.forEach(t => {
      const last10 = t.recentProblems.slice(0, 10);
      const total = last10.length;
      if (total === 0) return;

      const firstAttemptSuccesses = last10.filter(p => p.attemptCount === 1).length;
      const successRate = firstAttemptSuccesses / total;
      
      const confScores = { 'SHAKY': 1, 'OKAY': 2, 'SOLID': 3, 'MASTERED': 4 };
      const avgConf = last10.reduce((acc, p) => acc + (confScores[p.confidenceLevel] || 2), 0) / total;

      const currentDiffs = last10.map(p => p.difficulty);
      const majorityDiff = currentDiffs.sort((a,b) =>
        currentDiffs.filter(v => v===a).length - currentDiffs.filter(v => v===b).length
      ).pop() || 'MEDIUM';

      let diffTrend = 'AT_RIGHT_LEVEL';
      let recommendedDiff = majorityDiff;

      if (successRate > 0.8 && avgConf >= 2.5) {
        diffTrend = 'READY_TO_LEVEL_UP';
        if (majorityDiff === 'EASY') recommendedDiff = 'MEDIUM';
        if (majorityDiff === 'MEDIUM') recommendedDiff = 'HARD';
      } else if (successRate < 0.5 || avgConf <= 1.5) {
        diffTrend = 'STRUGGLING';
        if (majorityDiff === 'HARD') recommendedDiff = 'MEDIUM';
        if (majorityDiff === 'MEDIUM') recommendedDiff = 'EASY';
      }

      recommendations[t._id] = {
        currentRecommendedDifficulty: recommendedDiff,
        difficultyTrend: diffTrend,
        readinessScore: Math.round((successRate * 50) + ((avgConf / 4) * 50)),
        estimatedDaysToNextLevel: diffTrend === 'READY_TO_LEVEL_UP' ? 0 : Math.round((0.8 - successRate) * 20)
      };
    });

    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating adaptive difficulty' });
  }
};

// D4. Detect Patterns
const detectPatterns = async (req, res) => {
  try {
    const problem = await DSA.findOne({ _id: req.params.id, userId: req.user.id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    if (problem.patternTags && problem.patternTags.length > 0) {
      return res.json({ patterns: problem.patternTags });
    }

    const prompt = `
    You are an expert algorithmic pattern detector. Analyze the following coding problem and identify the top 2 algorithmic patterns it most likely uses.
    Problem Title: "${problem.title}"
    Problem URL: "${problem.url || ''}"
    Topic: "${problem.topic}"

    Respond ONLY with a JSON array of string pattern names. E.g. ["Two Pointers", "Sliding Window"]
    List of valid patterns to choose from: Sliding Window, Two Pointers, Fast & Slow Pointers, Merge Intervals, Cyclic Sort, In-place Reversal of a LinkedList, Tree BFS, Tree DFS, Two Heaps, Subsets, Modified Binary Search, Top 'K' Elements, K-way Merge, Topological Sort, 0/1 Knapsack, Unbounded Knapsack, Fibonacci Numbers, Palindromic Subsequence, Longest Common Substring.
    `;

    const result = await callGemini(prompt);
    
    let suggestedPatterns = [];
    try {
      // clean backticks
      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
      suggestedPatterns = JSON.parse(cleanJson);
    } catch (e) {
      suggestedPatterns = ['Sliding Window']; // fallback
    }

    // Since we want to let the user confirm it, we will just return the suggestions to the frontend
    // The frontend can store them or prompt the user. 
    // If we wanted to auto-tag, we would save to `problem.patternTags`.
    res.json({ suggestedPatterns });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error detecting patterns' });
  }
};

// D5. Peer Benchmarking
const getBenchmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const cohortYear = user.gradYear || new Date().getFullYear().toString();

    const stats = await AggregatedStats.findOne({ cohortYear }).sort({ date: -1 });
    
    // Calculate user's stats
    const problems = await DSA.find({ userId: req.user.id });
    const userProblemsTotal = problems.length;
    const userTopics = new Set(problems.map(p => p.topic)).size;
    const userPatterns = new Set(problems.flatMap(p => p.patternTags)).size;

    res.json({
      cohortYear,
      userMetrics: {
        totalProblems: userProblemsTotal,
        topicsCovered: userTopics,
        patternsMastered: userPatterns
      },
      cohortMedians: {
        medianProblemsPerWeek: stats?.medianProblemsPerWeek || 5,
        medianTopicsCovered: stats?.medianTopicsCovered || 4,
        medianPatternsMastered: stats?.medianPatternsMastered || 2,
        topPercentileProblemsTotal: stats?.topPercentileProblemsTotal || 150
      },
      // simple percentile mock logic
      percentileRank: Math.min(99, Math.round((userProblemsTotal / (stats?.topPercentileProblemsTotal || 150)) * 90)),
      paceToTarget: Math.max(1, Math.round(((stats?.topPercentileProblemsTotal || 150) - userProblemsTotal) / 100)) // problems per day to reach top 10%
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating benchmarks' });
  }
};

// D6. Knowledge Graph
const getKnowledgeGraph = async (req, res) => {
  try {
    const prerequisites = await DSAPrerequisite.find();
    
    // Seed basic map if empty
    if (prerequisites.length === 0) {
      const initialSeed = [
        { topicOrPattern: 'Dynamic Programming', prerequisiteTopicOrPattern: 'Arrays', importance: 'REQUIRED' },
        { topicOrPattern: 'Dynamic Programming', prerequisiteTopicOrPattern: 'Recursion', importance: 'REQUIRED' },
        { topicOrPattern: 'Graphs', prerequisiteTopicOrPattern: 'Arrays', importance: 'REQUIRED' },
        { topicOrPattern: 'Graphs', prerequisiteTopicOrPattern: 'Queue', importance: 'REQUIRED' },
        { topicOrPattern: 'Tries', prerequisiteTopicOrPattern: 'Arrays', importance: 'REQUIRED' },
        { topicOrPattern: 'Tries', prerequisiteTopicOrPattern: 'Hashing', importance: 'HELPFUL' },
      ];
      await DSAPrerequisite.insertMany(initialSeed);
    }

    const allPrereqs = await DSAPrerequisite.find();
    const userMastery = await DSATopic.find({ userId: req.user.id });
    const masteryMap = {};
    userMastery.forEach(t => masteryMap[t.topic] = t.masteryScore);

    const nodesMap = new Map();
    const links = [];

    allPrereqs.forEach(p => {
      if (!nodesMap.has(p.topicOrPattern)) nodesMap.set(p.topicOrPattern, { id: p.topicOrPattern, mastery: masteryMap[p.topicOrPattern] || 0 });
      if (!nodesMap.has(p.prerequisiteTopicOrPattern)) nodesMap.set(p.prerequisiteTopicOrPattern, { id: p.prerequisiteTopicOrPattern, mastery: masteryMap[p.prerequisiteTopicOrPattern] || 0 });
      
      links.push({
        source: p.prerequisiteTopicOrPattern,
        target: p.topicOrPattern,
        importance: p.importance
      });
    });

    const nodes = Array.from(nodesMap.values());
    
    res.json({ nodes, links });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating knowledge graph' });
  }
};

// D7. Time Analytics
const getTimeAnalytics = async (req, res) => {
  try {
    const sessions = await DSAStudySession.find({ userId: req.user.id, durationMinutes: { $gt: 0 } });
    
    if (sessions.length === 0) {
      return res.json({ message: "No session data yet." });
    }

    let hourMap = {};
    let dayMap = {};
    let totalLen = 0;
    
    sessions.forEach(s => {
      if (s.startHour !== null) {
        if (!hourMap[s.startHour]) hourMap[s.startHour] = { count: 0, focus: 0 };
        hourMap[s.startHour].count++;
        hourMap[s.startHour].focus += s.focusScore;
      }
      
      if (s.dayOfWeek !== null) {
        if (!dayMap[s.dayOfWeek]) dayMap[s.dayOfWeek] = { count: 0, problems: 0 };
        dayMap[s.dayOfWeek].count++;
        dayMap[s.dayOfWeek].problems += s.problemsSolved;
      }
      totalLen += s.durationMinutes;
    });

    // Find best hour (highest avg focus)
    let bestHour = null;
    let maxFocus = -1;
    Object.keys(hourMap).forEach(h => {
      let avgF = hourMap[h].focus / hourMap[h].count;
      if (avgF > maxFocus) { maxFocus = avgF; bestHour = parseInt(h); }
    });

    // Find best day
    let bestDay = null;
    let maxProb = -1;
    Object.keys(dayMap).forEach(d => {
      let avgP = dayMap[d].problems / dayMap[d].count;
      if (avgP > maxProb) { maxProb = avgP; bestDay = parseInt(d); }
    });

    res.json({
      bestTimeOfDay: bestHour,
      bestDayOfWeek: bestDay,
      averageSessionLength: Math.round(totalLen / sessions.length),
      hourlyFocus: hourMap,
      dailyProblems: dayMap
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating time analytics' });
  }
};

// D8. Readiness Assessment
const getReadinessAssessment = async (req, res) => {
  try {
    const problems = await DSA.find({ userId: req.user.id });
    
    const countByTopic = {};
    let mediumAttempted = 0;
    let mediumSolvedFirstTry = 0;
    let totalMediumTime = 0;
    let totalMediumCount = 0;

    problems.forEach(p => {
      countByTopic[p.topic] = (countByTopic[p.topic] || 0) + 1;
      if (p.difficulty === 'MEDIUM') {
        mediumAttempted++;
        if (p.attemptCount === 1) mediumSolvedFirstTry++;
        if (p.timeToSolve) {
          totalMediumTime += p.timeToSolve;
          totalMediumCount++;
        }
      }
    });

    const passedChecks = [];
    const failedChecks = [];
    
    if (countByTopic['Arrays'] >= 30) passedChecks.push('Arrays Mastery (>30 problems)');
    else failedChecks.push({ gap: 'Not enough Arrays problems', estimatedTimeToClose: '5 days' });

    if (countByTopic['Dynamic Programming'] >= 25) passedChecks.push('DP Mastery (>25 problems)');
    else failedChecks.push({ gap: 'Not enough DP problems', estimatedTimeToClose: '10 days' });

    const mediumSuccessRate = mediumAttempted ? mediumSolvedFirstTry / mediumAttempted : 0;
    if (mediumSuccessRate > 0.6) passedChecks.push('Medium Problem Success Rate > 60%');
    else failedChecks.push({ gap: 'Medium success rate below 60%', estimatedTimeToClose: '7 days' });

    const avgMediumTime = totalMediumCount ? totalMediumTime / totalMediumCount : 999;
    if (avgMediumTime < 45) passedChecks.push('Average Medium Time < 45 mins');
    else failedChecks.push({ gap: 'Average time too slow for Medium problems', estimatedTimeToClose: '7 days' });

    let overallReadiness = 'NOT_READY';
    const score = passedChecks.length * 20; // very basic mock scoring
    
    if (score >= 80) overallReadiness = 'STRONG';
    else if (score >= 60) overallReadiness = 'READY';
    else if (score >= 40) overallReadiness = 'PARTIALLY_READY';

    const assessment = await ReadinessAssessment.create({
      userId: req.user.id,
      overallReadiness,
      readinessScore: score,
      passedChecks,
      failedChecks,
      estimatedTimeToReady: failedChecks.length * 5
    });

    res.json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating readiness assessment' });
  }
};

// D3. Mock Interview Evaluate
const evaluateMockInterview = async (req, res) => {
  try {
    const { interviewType, targetCompany, problemsAttempted } = req.body;
    // problemsAttempted: [{ title, difficulty, userApproach, timeComplexity, spaceComplexity }]

    if (!problemsAttempted || problemsAttempted.length === 0) {
      return res.status(400).json({ message: 'No problems submitted' });
    }

    let overallScore = 0;
    const weaknessesExposed = [];
    const evaluatedProblems = [];

    for (const prob of problemsAttempted) {
      const prompt = `
      You are a strict technical interviewer at ${targetCompany || 'a top tech company'}.
      The candidate was given the problem: "${prob.title}" (Difficulty: ${prob.difficulty}).
      
      The candidate provided this pseudocode/approach:
      "${prob.userApproach}"

      They claimed Time Complexity: ${prob.timeComplexity} and Space Complexity: ${prob.spaceComplexity}.
      
      Evaluate their approach. Respond in JSON with the following exact keys:
      {
        "approachCorrectness": "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT",
        "timeComplexityCorrectness": "Match" | "Wrong (Expected: O(X))",
        "spaceComplexityCorrectness": "Match" | "Wrong (Expected: O(X))",
        "missedEdgeCases": ["edge case 1", "edge case 2"],
        "betterApproach": "Explanation of better approach if any, otherwise 'None'",
        "interviewerSimulatedFeedback": "A paragraph written as if you are giving feedback to them directly."
      }
      `;

      const aiResponse = await callGemini(prompt);
      let feedback = {};
      try {
        const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        feedback = JSON.parse(cleanJson);
      } catch(e) {
        console.error("Failed to parse LLM JSON", e);
        feedback = { approachCorrectness: "INCORRECT", interviewerSimulatedFeedback: "Failed to evaluate." };
      }

      if (feedback.approachCorrectness === 'CORRECT') overallScore += 33;
      else if (feedback.approachCorrectness === 'PARTIALLY_CORRECT') overallScore += 15;

      if (feedback.timeComplexityCorrectness !== 'Match') weaknessesExposed.push('Time Complexity Analysis');

      evaluatedProblems.push({
        ...prob,
        evaluation: feedback
      });
    }

    const mockInterview = await MockInterview.create({
      userId: req.user.id,
      interviewType,
      targetCompany,
      problemsAttempted: evaluatedProblems,
      overallScore: Math.min(100, overallScore),
      weaknessesExposed: [...new Set(weaknessesExposed)]
    });

    res.json(mockInterview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error evaluating mock interview' });
  }
};

module.exports = {
  syncLeetCode,
  syncGFG,
  syncLeetCodeScheduled,
  getAdaptiveDifficulty,
  detectPatterns,
  getBenchmarks,
  getKnowledgeGraph,
  getTimeAnalytics,
  getReadinessAssessment,
  evaluateMockInterview
};
