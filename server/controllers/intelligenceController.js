const { GoogleGenAI } = require('@google/genai');
const Application = require('../models/Application');
const PredictionFeedback = require('../models/PredictionFeedback');
const NegotiationSession = require('../models/NegotiationSession');
const User = require('../models/User');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Prediction caching (simple memory cache)
const predictionCache = new Map();

exports.predictOutcome = async (req, res) => {
  try {
    const appId = req.params.id;
    const cacheKey = `pred_${appId}`;
    
    if (predictionCache.has(cacheKey)) {
      return res.json(predictionCache.get(cacheKey));
    }

    const currentApp = await Application.findById(appId);
    if (!currentApp) return res.status(404).json({ error: 'Application not found' });

    // Fetch terminal apps
    const terminalApps = await Application.find({ 
      userId: req.user.id,
      status: { $in: ['OFFER', 'REJECTED'] }
    });

    if (terminalApps.length < 10) {
      return res.json({ notEnoughData: true, message: 'Need at least 10 completed applications to generate predictions.' });
    }

    // Prepare features
    const historyData = terminalApps.map(app => ({
      status: app.status,
      source: app.source,
      priority: app.priority,
      fitScore: app.fitScore || 0,
      role: app.role,
      daysToTerminal: Math.floor((new Date(app.updatedAt) - new Date(app.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    const currentFeatures = {
      source: currentApp.source,
      priority: currentApp.priority,
      fitScore: currentApp.fitScore || 0,
      role: currentApp.role
    };

    const prompt = `You are a career placement prediction engine. 
    Here is a student's past application history: ${JSON.stringify(historyData)}.
    Here is their current application: ${JSON.stringify(currentFeatures)}.
    
    Based ONLY on patterns in this specific user's history, predict the outcome.
    Return ONLY a valid JSON object with:
    {
      "predictedOutcome": "LIKELY_POSITIVE" | "UNCERTAIN" | "LIKELY_REJECTION",
      "confidence": <number 0-100>,
      "keyFactor": "<one sentence explaining the strongest correlation>",
      "recommendation": "<one actionable sentence>"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text;
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const prediction = JSON.parse(rawText);
    predictionCache.set(cacheKey, prediction);

    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.predictionFeedback = async (req, res) => {
  try {
    const { predictedOutcome, actualOutcome, wasCorrect } = req.body;
    const feedback = await PredictionFeedback.create({
      applicationId: req.params.id,
      userId: req.user.id,
      predictedOutcome,
      actualOutcome,
      wasCorrect
    });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.negotiationSim = async (req, res) => {
  try {
    const { offeredCTC, targetCTC, batna } = req.body;
    const app = await Application.findById(req.params.id);
    const user = await User.findById(req.user.id);

    const prompt = `Act as an expert salary negotiation coach for tech placements.
    Student Profile: ${user.branch || 'CS'} major, CGPA ${user.cgpa || 8.0}.
    Company: ${app.company}, Role: ${app.role}.
    Offered CTC: Base ${offeredCTC.base}, Variable ${offeredCTC.variable}, Equity ${offeredCTC.equity}.
    Target CTC: ${targetCTC}.
    BATNA (Alternative offers): ${batna}.
    
    Generate a highly specific negotiation strategy. Return ONLY a valid JSON object:
    {
      "isAdvisable": boolean,
      "recommendedAsk": "string",
      "justification": "string",
      "emailScript": "string",
      "callOpeningLine": "string",
      "likelyCounterOffers": ["string", "string"],
      "walkAwayPoint": "string"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text;
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const strategy = JSON.parse(rawText);

    let session = await NegotiationSession.findOne({ applicationId: app._id });
    if (!session) {
      session = await NegotiationSession.create({
        applicationId: app._id,
        userId: req.user.id,
        offeredCTC,
        targetCTC,
        strategy,
        chatHistory: [{ role: 'model', parts: [{ text: "Hi! I'm ready to roleplay the negotiation. I'll act as the recruiter from " + app.company + ". You start by asking for your target compensation." }] }]
      });
    } else {
      session.strategy = strategy;
      await session.save();
    }

    res.json(session);
  } catch (error) {
    console.error('Negotiation sim error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.negotiationChat = async (req, res) => {
  try {
    const { message } = req.body;
    const session = await NegotiationSession.findOne({ applicationId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const app = await Application.findById(req.params.id);

    const systemPrompt = `You are playing the role of a recruiter at ${app.company} hiring for ${app.role}. The candidate is negotiating their offer. Act realistically. Sometimes push back, sometimes concede slightly if they make a good point. Do NOT act like an AI assistant. Stay in character. Keep responses brief like a real conversation.`;

    const formattedHistory = session.chatHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts || [{ text: msg.content || msg.parts[0].text }]
    }));

    formattedHistory.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedHistory,
      systemInstruction: systemPrompt
    });

    formattedHistory.push({ role: 'model', parts: [{ text: response.text }] });

    session.chatHistory = formattedHistory;
    await session.save();

    res.json({ reply: response.text, chatHistory: session.chatHistory });
  } catch (error) {
    console.error('Negotiation chat error:', error);
    res.status(500).json({ error: error.message });
  }
};
