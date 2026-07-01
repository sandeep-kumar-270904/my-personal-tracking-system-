const { GoogleGenAI } = require('@google/genai');
const puppeteer = require('puppeteer');
const Application = require('../models/Application');
const ApplicationEmail = require('../models/ApplicationEmail');
const Resume = require('../models/Resume');
const fs = require('fs');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiCache = new Map(); // Simple in-memory cache for JD analysis

const analyzeJD = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    if (aiCache.has(url)) {
      return res.json(aiCache.get(url));
    }

    let textContent = '';
    try {
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      textContent = await page.evaluate(() => document.body.innerText.substring(0, 5000));
      await browser.close();
    } catch (e) {
      console.error('Puppeteer scraping failed', e);
      return res.status(500).json({ message: 'Failed to extract content from the URL. Please make sure the URL is public and valid.' });
    }

    const prompt = `Analyze the following job description text and extract structured information. Return ONLY valid JSON and nothing else.
    {
      "requiredSkills": ["skill1", "skill2"],
      "niceToHaveSkills": ["skill3"],
      "experienceLevel": "fresher|junior|mid|senior",
      "roleType": "frontend|backend|fullstack|ml|data|devops|general",
      "ctcRange": "salary info if mentioned, else null",
      "keyResponsibilities": ["resp1", "resp2 (max 5)"],
      "redFlags": ["any concerning things like unpaid, or high experience for entry role"]
    }
    Text: ${textContent}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let aiResponse = result.text;
    // Strip markdown formatting if present
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(aiResponse);
    aiCache.set(url, parsed);
    // Auto-expire cache after 1 hour (optional, but good for memory)
    setTimeout(() => aiCache.delete(url), 1000 * 60 * 60);

    res.json(parsed);
  } catch (error) {
    console.error('Analyze JD Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const matchResumeToJD = async (req, res) => {
  try {
    const { requiredSkills, resumeId } = req.body;
    if (!requiredSkills || !resumeId) return res.status(400).json({ message: 'requiredSkills and resumeId are required' });

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Since we don't have the parsed resume content handy and it's a PDF, we would need to parse it using pdf-parse.
    // For simplicity, we assume we have pdf-parse installed as seen in package.json.
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(resume.filePath);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    const prompt = `Compare these required skills with the user's resume text. Return ONLY valid JSON and nothing else.
    {
      "matchPercentage": integer 0-100,
      "matchedSkills": ["skill1"],
      "missingSkills": ["skill2"]
    }
    Required Skills: ${requiredSkills.join(', ')}
    Resume Text: ${resumeText.substring(0, 5000)}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let aiResponse = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(aiResponse));
  } catch (error) {
    console.error('Match Resume Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const processEmailThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { rawText } = req.body;

    const prompt = `Analyze this email thread related to a job application. Return ONLY valid JSON and nothing else.
    {
      "senderName": "name or null",
      "senderRole": "role or null",
      "keyDates": ["date 1", "date 2"],
      "actionItems": ["action 1"],
      "tone": "positive|neutral|negative",
      "suggestedStatus": "INTERVIEW_SCHEDULED|REJECTED|OFFER|null"
    }
    Email Thread: ${rawText}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let aiResponse = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedData = JSON.parse(aiResponse);

    const emailRecord = new ApplicationEmail({
      applicationId: id,
      userId: req.user._id,
      rawText,
      extractedData
    });
    await emailRecord.save();

    res.status(201).json(emailRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const analyzeRejection = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOne({ _id: id, userId: req.user._id });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Gather context
    const allApps = await Application.find({ userId: req.user._id, deletedAt: null });
    const rejections = allApps.filter(a => a.status === 'REJECTED');
    
    // Minimal pattern string
    const summary = rejections.map(a => `${a.company} (${a.role}) - fitScore: ${a.fitScore}`).join(', ');

    const prompt = `This application was rejected: Company: ${application.company}, Role: ${application.role}, Fit Score: ${application.fitScore}. 
    User's other rejections: ${summary.substring(0, 1000)}.
    Analyze why this might have happened and provide actionable advice. Return ONLY valid JSON and nothing else.
    {
      "diagnosis": "2-3 sentence analysis",
      "actionableSuggestions": ["suggestion 1", "suggestion 2"]
    }`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let aiResponse = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(aiResponse);

    application.rejectionAnalysis = parsed;
    await application.save();

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationEmails = async (req, res) => {
  try {
    const emails = await ApplicationEmail.find({ applicationId: req.params.id }).sort({ createdAt: -1 });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  analyzeJD,
  matchResumeToJD,
  processEmailThread,
  analyzeRejection,
  getApplicationEmails
};
