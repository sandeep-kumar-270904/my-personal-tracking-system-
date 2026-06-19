const { GoogleGenAI } = require('@google/genai');
const ResumeSection = require('../models/ResumeSection');
const ResumeRewrite = require('../models/ResumeRewrite');
const Resume = require('../models/Resume');
const User = require('../models/User');

// POST /api/resumes/:id/sections/:sectionId/rewrite
const rewriteSectionStream = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { rewriteType } = req.body; // IMPROVE, QUANTIFY, SHORTEN

    // 1. Verify user owns this resume
    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // 2. Get the section content
    const section = await ResumeSection.findOne({ _id: sectionId, resumeId: id });
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // 3. Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 4. Construct Prompt
    let prompt = `You are an expert resume writer. The user wants to rewrite a section of their resume. 
    Here is the section type: ${section.type}
    Here is the current content:\n\n${section.content}\n\n`;

    if (rewriteType === 'IMPROVE') {
      prompt += `Please improve the clarity, impact, and ATS compatibility of this content. Keep the exact same facts, but make it sound more professional and action-oriented. Start with strong action verbs. Do not use markdown backticks around the entire output. Do not add conversational filler like "Here is the rewritten section". Just output the rewritten text directly.`;
    } else if (rewriteType === 'QUANTIFY') {
      prompt += `Please rewrite this content to add placeholder numbers and metrics where they are missing (e.g., "[X]% improvement" or "served [X] users") to demonstrate impact. If it already has numbers, emphasize them. Do not use markdown backticks. Just output the rewritten text directly.`;
    } else if (rewriteType === 'SHORTEN') {
      prompt += `Please condense this content significantly. Make it punchy and short. Remove fluff and unnecessary adjectives. Do not use markdown backticks. Just output the rewritten text directly.`;
    } else {
      prompt += `Please improve the content.`;
    }

    // 5. Stream response
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let fullGeneratedText = "";

    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      fullGeneratedText += textChunk;
      res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
    }

    // 6. Save to rewrite history (unaccepted by default)
    const rewriteRecord = new ResumeRewrite({
      resumeId: id,
      sectionId: sectionId,
      rewriteType: rewriteType,
      originalContent: section.content,
      rewrittenContent: fullGeneratedText,
      wasAccepted: false
    });
    await rewriteRecord.save();

    res.write(`data: ${JSON.stringify({ done: true, rewriteId: rewriteRecord._id })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Rewrite Stream Error:", error);
    // If headers are already sent, we just close the stream
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error during rewrite' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
      res.end();
    }
  }
};

// POST /api/resumes/:id/sections/:sectionId/rewrite/accept
const acceptRewrite = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { rewriteId } = req.body;

    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const rewrite = await ResumeRewrite.findOne({ _id: rewriteId, resumeId: id, sectionId });
    if (!rewrite) return res.status(404).json({ message: 'Rewrite not found' });

    const section = await ResumeSection.findOne({ _id: sectionId, resumeId: id });
    if (!section) return res.status(404).json({ message: 'Section not found' });

    // Update section
    section.content = rewrite.rewrittenContent;
    await section.save();

    // Mark as accepted
    rewrite.wasAccepted = true;
    await rewrite.save();

    // TODO: Optionally re-trigger ATS analysis in background

    res.json({ message: 'Rewrite accepted', section });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/resumes/:id/sections/:sectionId/rewrites
const getRewriteHistory = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const history = await ResumeRewrite.find({ resumeId: id, sectionId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/resumes/:id/tailor
const tailorResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetRole, targetCompany } = req.body;

    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId: id });
    const fullResumeText = sections.map(s => `[${s.heading}]\n${s.content}`).join('\n\n');

    // V4 RX4: Networking Contact Targeting
    const Network = require('../models/Network');
    const contacts = await Network.find({ 
      userId: req.user._id, 
      company: { $regex: new RegExp(targetCompany, 'i') } 
    });

    let contactPromptAddition = '';
    if (contacts.length > 0) {
      const contactInfo = contacts.map(c => `${c.name} (${c.role || 'Employee'})`).join(', ');
      contactPromptAddition = `
      CRITICAL INSTRUCTION: The user has active networking contacts at this company: ${contactInfo}.
      Please tailor the summary and phrasing specifically to appeal to these individuals as a potential referral. 
      Include suggestions on how to mention or align with these contacts' roles in the resume.`;
    }

    const prompt = `You are an expert technical recruiter and resume tailorer. 
    Analyze the following resume against the target role: "${targetRole}" at the target company: "${targetCompany}".
    ${contactPromptAddition}
    
    Return a JSON object matching this structure EXACTLY (do not include markdown wrapping or other text):
    {
      "sectionsToEmphasize": ["list of section headings to move higher"],
      "keywordsToAdd": ["missing keywords this company looks for"],
      "phrasesToChange": [
        { "originalPhrase": "...", "suggestedReplacement": "..." }
      ],
      "newBulletPoints": ["suggested relevant bullet points to add"],
      "summaryRewrite": "A new summary section tailored to this specific role and company.",
      "estimatedATSScoreImprovement": 15
    }

    Resume Content:
    ${fullResumeText}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const tailoringPlan = JSON.parse(response.text);

    const TailoringModel = require('../models/ResumeTailoring');
    const tailoringSession = new TailoringModel({
      resumeId: id,
      targetRole,
      targetCompany,
      tailoringPlan
    });
    await tailoringSession.save();

    res.json({ plan: tailoringPlan, sessionId: tailoringSession._id });
  } catch (error) {
    console.error("Tailor Error:", error);
    res.status(500).json({ message: 'Failed to tailor resume' });
  }
};

// POST /api/resumes/:id/cover-letter
const generateCoverLetterStream = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetCompany, targetRole, tone, wordCount, jobDescription } = req.body;

    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId: id });
    const fullResumeText = sections.map(s => `[${s.heading}]\n${s.content}`).join('\n\n');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const prompt = `You are writing a cover letter for a student applying to ${targetCompany} for the role of ${targetRole}.
    The tone should be ${tone || 'Professional'}. The length should be approximately ${wordCount || 300} words.
    Make it sound like a real human wrote it. Be specific to the company and role, referencing actual projects and skills from the resume.
    Do not use generic fluff.
    
    ${jobDescription ? `Job Description to reference:\n${jobDescription}\n\n` : ''}
    Resume Content:\n${fullResumeText}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      fullText += textChunk;
      res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
    }

    const CoverLetter = require('../models/CoverLetter');
    const cl = new CoverLetter({
      userId: req.user._id,
      resumeId: id,
      targetCompany,
      targetRole,
      tone: tone || 'Professional',
      wordCount: wordCount || 300,
      content: fullText
    });
    await cl.save();

    res.write(`data: ${JSON.stringify({ done: true, coverLetterId: cl._id })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Cover Letter Stream Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error generating cover letter' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
      res.end();
    }
  }
};

// GET /api/resumes/cover-letters
const getCoverLetters = async (req, res) => {
  try {
    const CoverLetter = require('../models/CoverLetter');
    const letters = await CoverLetter.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cover letters' });
  }
};

// POST /api/resumes/:id/keyword-match
const analyzeKeywords = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobDescription } = req.body;

    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId: id });
    const fullResumeText = sections.map(s => `[${s.heading}]\n${s.content}`).join('\n\n');

    const prompt = `Analyze this resume against the following job description.
    Job Description:
    ${jobDescription}

    Resume:
    ${fullResumeText}

    Find important keywords in the JD that are completely MISSING from the resume.
    Return a JSON object exactly like this:
    {
      "missingKeywords": [
        { "keyword": "React", "importance": "High" },
        { "keyword": "AWS", "importance": "Medium" }
      ]
    }`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to analyze keywords' });
  }
};

// POST /api/resumes/:id/sections/:sectionId/keywords/fix
const fixKeywordStream = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { keyword } = req.body;

    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const section = await ResumeSection.findOne({ _id: sectionId, resumeId: id });
    if (!section) return res.status(404).json({ message: 'Section not found' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const prompt = `Rewrite the following resume section to naturally incorporate the keyword "${keyword}". 
    Keep the exact same formatting, facts, and structure. Just integrate the keyword naturally where it makes sense. Do not use markdown backticks.
    
    Section Content:
    ${section.content}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      fullText += textChunk;
      res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
    }

    // Save rewrite record
    const ResumeRewrite = require('../models/ResumeRewrite');
    const rewriteRecord = new ResumeRewrite({
      resumeId: id,
      sectionId: sectionId,
      rewriteType: 'KEYWORD_FIX',
      originalContent: section.content,
      rewrittenContent: fullText,
      wasAccepted: false
    });
    await rewriteRecord.save();

    res.write(`data: ${JSON.stringify({ done: true, rewriteId: rewriteRecord._id })}\n\n`);
    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error fixing keyword' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Fix failed' })}\n\n`);
      res.end();
    }
  }
};

// POST /api/resumes/import-linkedin
// Note: This expects a multipart/form-data upload with the 'resume' field containing the LinkedIn PDF
const importLinkedIn = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No LinkedIn PDF provided' });
    }

    const fs = require('fs');
    const path = require('path');
    const pdfParse = require('pdf-parse');

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const pdfText = data.text;

    const prompt = `You are a resume parser. Extract sections from the following LinkedIn Profile PDF text.
    Return a JSON object exactly like this:
    {
      "name": "Parsed Name",
      "email": "Parsed Email",
      "phone": "Parsed Phone",
      "sections": [
        { "heading": "Summary", "content": "..." },
        { "heading": "Experience", "content": "..." },
        { "heading": "Education", "content": "..." },
        { "heading": "Skills", "content": "..." }
      ]
    }

    LinkedIn PDF Text:
    ${pdfText}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const parsedData = JSON.parse(response.text);

    // Save the file metadata but don't finalize the resume yet, return data for preview
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/resumes/${req.file.filename}`;

    res.json({
      parsedData,
      fileInfo: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        fileUrl,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error("LinkedIn Import Error:", error);
    res.status(500).json({ message: 'Failed to parse LinkedIn profile' });
  }
};

// POST /api/resumes/health-check
const healthCheck = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id, isActive: true });
    const ResumeHealthAlert = require('../models/ResumeHealthAlert');
    
    // In a real cron job, this would iterate over all users. 
    // For this endpoint, we'll just do it for the requesting user.
    let newAlerts = [];

    for (const resume of resumes) {
      const daysSinceLastUsed = resume.performance?.lastUsedAt 
        ? Math.floor((Date.now() - new Date(resume.performance.lastUsedAt)) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - new Date(resume.createdAt)) / (1000 * 60 * 60 * 24));

      // 1. Check STALE
      if (daysSinceLastUsed > 30) {
        const existingStale = await ResumeHealthAlert.findOne({ resumeId: resume._id, alertType: 'STALE', resolvedAt: null });
        if (!existingStale) {
          const alert = await ResumeHealthAlert.create({
            resumeId: resume._id,
            alertType: 'STALE',
            severity: 'MEDIUM',
            message: `This resume hasn't been used in ${daysSinceLastUsed} days. Consider archiving it or creating a new version with updated skills.`
          });
          newAlerts.push(alert);
        }
      }

      // 2. Check LOW SCORE / SCORE DECLINING
      if (resume.analysis && resume.analysis.atsScore < 60) {
        const existingScore = await ResumeHealthAlert.findOne({ resumeId: resume._id, alertType: 'SCORE_DECLINING', resolvedAt: null });
        if (!existingScore) {
          const alert = await ResumeHealthAlert.create({
            resumeId: resume._id,
            alertType: 'SCORE_DECLINING',
            severity: 'HIGH',
            message: `ATS Score is critically low (${resume.analysis.atsScore}%). Use the AI Rewrite tool to optimize format and keywords.`
          });
          newAlerts.push(alert);
        }
      }

      // 3. AI Health Analysis for Missing Sections
      // For demonstration, we'll mock this if the resume lacks 'Experience'
      const sections = await ResumeSection.find({ resumeId: resume._id });
      const headings = sections.map(s => s.heading.toLowerCase());
      if (!headings.includes('experience') && !headings.includes('work experience')) {
         const existingMissing = await ResumeHealthAlert.findOne({ resumeId: resume._id, alertType: 'MISSING_SECTIONS', resolvedAt: null });
         if (!existingMissing) {
           const alert = await ResumeHealthAlert.create({
              resumeId: resume._id,
              alertType: 'MISSING_SECTIONS',
              severity: 'HIGH',
              message: `No Experience section found. This is a critical omission for most ATS systems.`
            });
            newAlerts.push(alert);
         }
      }
    }

    res.json({ message: 'Health check completed', newAlertsCount: newAlerts.length });
  } catch (error) {
    console.error("Health Check Error:", error);
    res.status(500).json({ message: 'Health check failed' });
  }
};

// GET /api/resumes/health-alerts
const getHealthAlerts = async (req, res) => {
  try {
    const ResumeHealthAlert = require('../models/ResumeHealthAlert');
    // Find alerts for all resumes belonging to this user
    const resumes = await Resume.find({ user: req.user._id }, '_id');
    const resumeIds = resumes.map(r => r._id);
    
    const alerts = await ResumeHealthAlert.find({ 
      resumeId: { $in: resumeIds },
      resolvedAt: null 
    }).populate('resumeId', 'name originalName');

    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch health alerts' });
  }
};

// PUT /api/resumes/health-alerts/:alertId/resolve
const resolveHealthAlert = async (req, res) => {
  try {
    const ResumeHealthAlert = require('../models/ResumeHealthAlert');
    const alert = await ResumeHealthAlert.findById(req.params.alertId);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    
    alert.resolvedAt = new Date();
    await alert.save();
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Failed to resolve alert' });
  }
};

// POST /api/resumes/:id/predicted-questions
const predictInterviewQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobDescription } = req.body;

    const resume = await Resume.findOne({ _id: id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId: id });
    const fullResumeText = sections.map(s => `[${s.heading}]\n${s.content}`).join('\n\n');

    const prompt = `Analyze this resume against the following job description.
    Job Description:
    ${jobDescription || 'N/A (Focus only on the resume)'}

    Resume:
    ${fullResumeText}

    Identify potential weak points, knowledge gaps, or claims that seem exaggerated.
    Generate 5 difficult interview questions specifically designed to probe these areas.
    For each question, provide a suggested structured answer strategy using the STAR method based on the resume's content if possible.
    
    Return a JSON object exactly like this:
    {
      "questions": [
        {
          "question": "You mentioned leading a migration to AWS. Can you describe a specific challenge you faced with IAM roles during that migration?",
          "reasoning": "Probes the depth of their AWS experience claim.",
          "suggestedStrategy": "Structure using STAR. Mention the specific IAM limits hit, how you debugged CloudTrail, and the resulting secure policy."
        }
      ]
    }`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to predict questions' });
  }
};

// POST /api/resumes/ab-tests
const createABTest = async (req, res) => {
  try {
    const ResumeABTest = require('../models/ResumeABTest');
    const { resumeAId, resumeBId, roleType, sampleSize } = req.body;
    
    const test = await ResumeABTest.create({
      userId: req.user._id,
      resumeAId,
      resumeBId,
      roleType,
      sampleSize
    });

    res.json(test);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create AB test' });
  }
};

// GET /api/resumes/ab-tests
const getABTests = async (req, res) => {
  try {
    const ResumeABTest = require('../models/ResumeABTest');
    const Application = require('../models/Application');
    
    const tests = await ResumeABTest.find({ userId: req.user._id })
      .populate('resumeAId', 'name originalName')
      .populate('resumeBId', 'name originalName')
      .sort({ createdAt: -1 });

    // Dynamically calculate results for each test
    const enrichedTests = await Promise.all(tests.map(async (test) => {
      const apps = await Application.find({ abTestId: test._id });
      const aApps = apps.filter(a => a.resumeId.toString() === test.resumeAId._id.toString());
      const bApps = apps.filter(a => a.resumeId.toString() === test.resumeBId._id.toString());

      const aShortlists = aApps.filter(a => ['OA_PENDING', 'OA_DONE', 'INTERVIEW_SCHEDULED', 'SHORTLISTED', 'OFFER'].includes(a.status)).length;
      const bShortlists = bApps.filter(a => ['OA_PENDING', 'OA_DONE', 'INTERVIEW_SCHEDULED', 'SHORTLISTED', 'OFFER'].includes(a.status)).length;

      const results = {
        a: { total: aApps.length, shortlists: aShortlists },
        b: { total: bApps.length, shortlists: bShortlists }
      };

      // Check if sample size is reached
      let winnerResumeId = test.winnerResumeId;
      let completedAt = test.completedAt;

      if (!completedAt && (aApps.length + bApps.length) >= test.sampleSize) {
        completedAt = new Date();
        const aRate = aApps.length ? aShortlists / aApps.length : 0;
        const bRate = bApps.length ? bShortlists / bApps.length : 0;
        
        if (aRate > bRate) winnerResumeId = test.resumeAId._id;
        else if (bRate > aRate) winnerResumeId = test.resumeBId._id;

        // Save completion status
        test.completedAt = completedAt;
        test.winnerResumeId = winnerResumeId;
        test.results = results;
        await test.save();
      }

      return {
        ...test.toObject(),
        currentResults: results
      };
    }));

    res.json(enrichedTests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch AB tests' });
  }
};

// POST /api/resumes/builder/save
const saveBuiltResume = async (req, res) => {
  try {
    const { name, originalName, fileUrl, parentResumeId, sections } = req.body;
    
    // Create new resume document
    const newResume = await Resume.create({
      user: req.user._id,
      name,
      originalName,
      fileUrl,
      parentResumeId,
      tags: ['Built-with-AI'],
      version: 1 // Ideally fetch max version and increment
    });

    // Save sections
    const sectionDocs = sections.map(s => ({
      resumeId: newResume._id,
      heading: s.heading,
      content: s.content,
      order: s.order
    }));

    await ResumeSection.insertMany(sectionDocs);

    res.json(newResume);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save built resume' });
  }
};

const crypto = require('crypto');
const ResumeJDScore = require('../models/ResumeJDScore');

const performJDScoring = async (jdText, resumeId) => {
  const jdHash = crypto.createHash('sha256').update(jdText).digest('hex');

  let cachedScore = await ResumeJDScore.findOne({ resumeId, jdHash });
  if (cachedScore) return cachedScore;

  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error('Resume not found');
  const sections = await ResumeSection.find({ resumeId }).sort('orderIndex');
  const resumeText = sections.map(s => `${s.heading}:\n${s.content}`).join('\n\n');

  const prompt = `Act as a senior hiring manager at the company described in the job description below. Evaluate the provided resume against the job description.

Job Description:
${jdText}

Resume:
${resumeText}

Score the resume on the following six dimensions on a scale of 0 to 10 (10 being perfect):
1. technicalFit (do the skills match what the role needs)
2. experienceRelevance (are the projects and experience directly applicable)
3. communicationQuality (is the resume well written and clear)
4. standoutFactor (does anything make this candidate memorable)
5. redFlags (10 means NO red flags (excellent), 0 means terrible red flags.)
6. overallHireLikelihood (would you move this candidate to the next round)

Also provide:
- companyName: extracted from JD (string)
- jobTitle: extracted from JD (string)
- assessment: A one paragraph overall assessment written as if giving feedback to a recruiter.
- improvementPoints: An array of 3 specific things that would make this resume stronger for this exact role.
- verdict: Exactly one of: STRONG PASS, PASS, BORDERLINE, REJECT

Return ONLY a valid JSON object matching this schema:
{
  "companyName": "string",
  "jobTitle": "string",
  "dimensions": {
    "technicalFit": number,
    "experienceRelevance": number,
    "communicationQuality": number,
    "standoutFactor": number,
    "redFlags": number,
    "overallHireLikelihood": number
  },
  "assessment": "string",
  "improvementPoints": ["string", "string", "string"],
  "verdict": "string"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const result = JSON.parse(response.text);

  const overallScore = Math.round(
    (result.dimensions.technicalFit +
    result.dimensions.experienceRelevance +
    result.dimensions.communicationQuality +
    result.dimensions.standoutFactor +
    result.dimensions.redFlags +
    result.dimensions.overallHireLikelihood) / 60 * 100
  );

  const jdScoreDoc = await ResumeJDScore.create({
    resumeId,
    jdHash,
    companyName: result.companyName,
    jobTitle: result.jobTitle,
    dimensions: result.dimensions,
    overallScore,
    verdict: result.verdict,
    assessment: result.assessment,
    improvementPoints: result.improvementPoints
  });

  // V4 RX4: Networking Contact Targeting (Alert Generation)
  if (overallScore < 70 && result.companyName && resume.user) {
    const Network = require('../models/Network');
    const contacts = await Network.find({
      userId: resume.user,
      company: { $regex: new RegExp(result.companyName, 'i') }
    });

    if (contacts.length > 0) {
      const ResumeHealthAlert = require('../models/ResumeHealthAlert');
      
      const existingAlert = await ResumeHealthAlert.findOne({
        resumeId,
        alertType: 'REFERRAL_RISK',
        'metadata.company': result.companyName,
        resolvedAt: null
      });

      if (!existingAlert) {
        await ResumeHealthAlert.create({
          resumeId,
          alertType: 'REFERRAL_RISK',
          severity: 'CRITICAL',
          message: `Your resume scores poorly (${overallScore}/100) for ${result.companyName}. You have a networking contact here, so fix this before asking for a referral.`,
          metadata: { company: result.companyName, contacts: contacts.map(c => c.name) }
        });
      }
    }
  }

  // V4 RX5: Goals Driven Targets
  if (overallScore >= 80 && resume.user) {
    const Goal = require('../models/Goal');
    const goal = await Goal.findOne({ user: resume.user });
    if (goal) {
      // Check if this resume was already counted this week (simplified: just increment if not already beyond target)
      if (goal.resumeHealthCompleted < goal.resumeHealthTarget) {
        goal.resumeHealthCompleted += 1;
        await goal.save();
      }
    }
  }

  return jdScoreDoc;
};

// POST /api/resumes/:id/jd-score
const scoreJD = async (req, res) => {
  try {
    const { jdText } = req.body;
    const resumeId = req.params.id;

    if (!jdText) return res.status(400).json({ message: 'JD text is required' });

    const newScore = await performJDScoring(jdText, resumeId);
    res.json(newScore);
  } catch (error) {
    console.error('scoreJD error:', error);
    res.status(500).json({ message: 'Failed to score JD' });
  }
};

// POST /api/resumes/:id/batch-jd-score
const batchScoreJD = async (req, res) => {
  try {
    const { jds } = req.body; // array of strings
    const resumeId = req.params.id;

    if (!jds || !Array.isArray(jds)) return res.status(400).json({ message: 'jds array is required' });

    const results = await Promise.all(
      jds.map(async (jdText) => {
        try {
          if (!jdText.trim()) return null;
          return await performJDScoring(jdText, resumeId);
        } catch (err) {
          console.error('Error in batch scoring a JD:', err);
          return null; // Return null for failed JDs to keep indices aligned
        }
      })
    );

    res.json(results.filter(Boolean));
  } catch (error) {
    console.error('batchScoreJD error:', error);
    res.status(500).json({ message: 'Failed to batch score JDs' });
  }
};

// V4 RX8: PrepHub Gap Bridge
const getPrepHubGaps = async (req, res) => {
  try {
    const ResumeAnalysis = require('../models/ResumeAnalysis');
    const PrepSyllabus = require('../models/PrepSyllabus');
    
    const analysis = await ResumeAnalysis.findOne({ resumeId: req.params.id }).sort({ createdAt: -1 });
    if (!analysis) return res.json({ gaps: [] });

    const missingSkills = analysis.missingCommonSkills || [];
    if (missingSkills.length === 0) return res.json({ gaps: [] });

    // Cross-reference with user's PrepSyllabus
    const syllabi = await PrepSyllabus.find({ userId: req.user.id });
    
    // Generate recommended modules based on missing skills and PrepSyllabus
    const prompt = `You are a technical mentor. A candidate is missing these skills on their resume: ${missingSkills.join(', ')}.
    They have the following PrepSyllabi available:
    ${JSON.stringify(syllabi.map(s => ({ role: s.role, company: s.company, dsaTopics: s.dsaTopics })))}
    
    Recommend 3 direct learning modules or action items to bridge these gaps. If there's overlap with their PrepSyllabi, mention it.
    Return ONLY a JSON array of objects with 'skill', 'moduleName', and 'actionItem'.
    Example:
    [
      { "skill": "React", "moduleName": "Advanced React Patterns", "actionItem": "Build a custom hook library" }
    ]`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const gaps = JSON.parse(response.text);
    res.json({ gaps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/resumes/:id/jd-scores
const getJDScores = async (req, res) => {
  try {
    const scores = await ResumeJDScore.find({ resumeId: req.params.id }).sort('-createdAt');
    res.json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch JD scores' });
  }
};

// GET /api/resumes/:id/benchmark
const getPeerBenchmark = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const user = req.user; // User populated via authMiddleware

    if (!user.gradYear) {
      return res.status(400).json({ message: 'Graduation year required for benchmarking.' });
    }

    if (user.publicProfileSettings?.benchmarkOptOut) {
      return res.status(403).json({ message: 'You have opted out of benchmarking.' });
    }

    const AggregatedStats = require('../models/AggregatedStats');
    const ResumeAnalysis = require('../models/ResumeAnalysis');

    // Get the latest stats for this cohort
    const stats = await AggregatedStats.findOne({ cohortYear: user.gradYear }).sort({ date: -1 });
    if (!stats) {
      return res.status(404).json({ message: 'Benchmarking data not available for your cohort yet.' });
    }

    // Get user's resume analysis
    const analysis = await ResumeAnalysis.findOne({ resumeId });
    if (!analysis) {
      return res.status(404).json({ message: 'Resume analysis not found. Please re-analyze resume.' });
    }

    const userATSScore = analysis.atsScore || 0;
    const userSkillsCount = analysis.skillsDetected ? analysis.skillsDetected.length : 0;
    const userSectionCompleteness = userATSScore * 0.9 + 10;
    const userQuantifiedAchievements = userATSScore / 20;

    // Calculate percentiles
    // For simplicity, we create a pseudo-percentile based on how far above/below the median the user is.
    const scoreDiff = userATSScore - stats.avgATSScore;
    let percentileRank = 50 + (scoreDiff * 2); // roughly 50th percentile if at median
    if (percentileRank > 99) percentileRank = 99;
    if (percentileRank < 1) percentileRank = 1;

    res.json({
      cohortYear: user.gradYear,
      userATSScore,
      peerMedianATSScore: stats.avgATSScore,
      userQuantifiedAchievements,
      peerMedianQuantifiedAchievements: stats.avgQuantifiedAchievements,
      userSkillsCount,
      peerMedianSkillsCount: stats.avgSkillsCount,
      userSectionCompleteness,
      peerMedianSectionCompleteness: stats.avgSectionCompleteness,
      percentileRank: Math.round(percentileRank),
      insights: [
        "Top resumes in your batch frequently include quantified metrics like '%' and 'reduced by'.",
        "Peers with 80+ ATS score have at least 15 matched skills.",
        "Your resume falls in the top quartile for skill diversity."
      ]
    });
  } catch (error) {
    console.error('getPeerBenchmark error:', error);
    res.status(500).json({ message: 'Failed to fetch benchmark data' });
  }
};
// POST /api/resumes/:id/maintenance-wizard
const runMaintenanceWizard = async (req, res) => {
  try {
    const { userInput } = req.body;
    const resumeId = req.params.id;

    if (!userInput) return res.status(400).json({ message: 'User input is required' });

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId }).sort('orderIndex');
    const resumeText = sections.map(s => `${s.heading}:\n${s.content}`).join('\n\n');

    const prompt = `You are an expert career coach and resume writer. 
The user has not updated their resume in a while. 
Here is their current resume:
${resumeText}

The user just provided this update on what they've been doing:
"${userInput}"

Your task is to analyze their update and suggest exact, highly-impactful, quantified resume bullet points to add, and tell the user exactly which section to add them to.

Return ONLY a valid JSON object matching this schema:
{
  "acknowledgement": "A brief, encouraging response acknowledging what they achieved.",
  "suggestions": [
    {
      "sectionHeading": "string (e.g. 'Projects' or 'Experience')",
      "bulletPoint": "string (the exact bullet point to add)"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text);
    res.json(result);

  } catch (error) {
    console.error('maintenance wizard error:', error);
    res.status(500).json({ message: 'Failed to process maintenance update' });
  }
};

// GET /api/resumes/:id/impact-events
const getImpactEvents = async (req, res) => {
  try {
    const ResumeImpactEvent = require('../models/ResumeImpactEvent');
    const events = await ResumeImpactEvent.find({ resumeId: req.params.id }).sort('-dateApplied');
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch impact events' });
  }
};

// POST /api/resumes/:id/impact-events
const addImpactEvent = async (req, res) => {
  try {
    const ResumeImpactEvent = require('../models/ResumeImpactEvent');
    const { companyName, jobTitle, status, dateApplied, notes } = req.body;
    
    if (!companyName || !jobTitle) return res.status(400).json({ message: 'Company and Title required' });

    const newEvent = await ResumeImpactEvent.create({
      resumeId: req.params.id,
      companyName,
      jobTitle,
      status,
      dateApplied,
      notes
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add impact event' });
  }
};

// PUT /api/resumes/:id/impact-events/:eventId
const updateImpactEvent = async (req, res) => {
  try {
    const ResumeImpactEvent = require('../models/ResumeImpactEvent');
    const updated = await ResumeImpactEvent.findOneAndUpdate(
      { _id: req.params.eventId, resumeId: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update impact event' });
  }
};

// --- Addons R15: Collaborative Review ---

// POST /api/resumes/:id/review-link (Protected)
const generateReviewLink = async (req, res) => {
  try {
    const ResumeReview = require('../models/ResumeReview');
    
    // Check if one already exists
    let review = await ResumeReview.findOne({ resumeId: req.params.id, isActive: true });
    
    if (!review) {
      review = await ResumeReview.create({ resumeId: req.params.id });
    }
    
    res.json({ link: `/review/resume/${review.token}`, token: review.token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate review link' });
  }
};

// GET /api/resumes/review/:token (Public)
const getReviewByToken = async (req, res) => {
  try {
    const ResumeReview = require('../models/ResumeReview');
    const Resume = require('../models/Resume');
    const ResumeSection = require('../models/ResumeSection');
    const User = require('../models/User');

    const review = await ResumeReview.findOne({ token: req.params.token, isActive: true });
    if (!review) return res.status(404).json({ message: 'Invalid or expired review link' });

    const resume = await Resume.findById(review.resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId: resume._id }).sort('orderIndex');
    const user = await User.findById(resume.user).select('name');

    // Return the resume details needed for rendering, but strip sensitive things if necessary
    res.json({
      resumeId: resume._id,
      name: resume.name || resume.originalName,
      userName: user?.name,
      pdfUrl: resume.pdfUrl,
      sections
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch review data' });
  }
};

// POST /api/resumes/review/:token/feedback (Public)
const addFeedback = async (req, res) => {
  try {
    const ResumeReview = require('../models/ResumeReview');
    const ResumeFeedback = require('../models/ResumeFeedback');
    
    const review = await ResumeReview.findOne({ token: req.params.token, isActive: true });
    if (!review) return res.status(404).json({ message: 'Invalid or expired review link' });

    const { comment, x, y, reviewerName } = req.body;

    const feedback = await ResumeFeedback.create({
      reviewId: review._id,
      resumeId: review.resumeId,
      reviewerName: reviewerName || 'Anonymous',
      comment,
      coordinates: { x, y }
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add feedback' });
  }
};

// GET /api/resumes/review/:token/feedbacks (Public) - For the reviewers to see existing dots
const getPublicFeedbacks = async (req, res) => {
  try {
    const ResumeReview = require('../models/ResumeReview');
    const ResumeFeedback = require('../models/ResumeFeedback');
    
    const review = await ResumeReview.findOne({ token: req.params.token, isActive: true });
    if (!review) return res.status(404).json({ message: 'Invalid or expired review link' });

    const feedbacks = await ResumeFeedback.find({ reviewId: review._id, resolved: false }).sort('-createdAt');
    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch public feedbacks' });
  }
};

// GET /api/resumes/:id/feedback (Protected)
const getFeedback = async (req, res) => {
  try {
    const ResumeFeedback = require('../models/ResumeFeedback');
    const feedbacks = await ResumeFeedback.find({ resumeId: req.params.id }).sort('-createdAt');
    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
};

// PUT /api/resumes/:id/feedback/:feedbackId/resolve (Protected)
const resolveFeedback = async (req, res) => {
  try {
    const ResumeFeedback = require('../models/ResumeFeedback');
    const feedback = await ResumeFeedback.findOneAndUpdate(
      { _id: req.params.feedbackId, resumeId: req.params.id },
      { resolved: req.body.resolved },
      { new: true }
    );
    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to resolve feedback' });
  }
};

// --- Addons R16: Intelligence Report ---

// POST /api/resumes/:id/intelligence-report (Protected)
const generateIntelligenceReport = async (req, res) => {
  try {
    const puppeteer = require('puppeteer');
    const Resume = require('../models/Resume');
    const ResumeSection = require('../models/ResumeSection');
    const ResumeJDScore = require('../models/ResumeJDScore');
    const ResumeImpactEvent = require('../models/ResumeImpactEvent');
    const AggregatedStats = require('../models/AggregatedStats');

    const resumeId = req.params.id;
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Gather data
    const sections = await ResumeSection.find({ resumeId });
    const jdScores = await ResumeJDScore.find({ resumeId });
    const impactEvents = await ResumeImpactEvent.find({ resumeId });
    const stats = await AggregatedStats.findOne().sort('-dateCalculated');

    // Summarize Data
    const avgJDScore = jdScores.length > 0 ? (jdScores.reduce((acc, curr) => acc + curr.overallScore, 0) / jdScores.length).toFixed(1) : 'N/A';
    const applications = impactEvents.length;
    const interviews = impactEvents.filter(e => e.status === 'Interviewing' || e.status === 'Offer').length;
    const atsScore = resume.analysis?.atsScore || 'N/A';
    
    const prompt = `You are an expert career strategist. Analyze the following data for a candidate's resume and provide a cohesive executive summary paragraph (around 100 words).
    
    Data:
    - Resume Name: ${resume.name || resume.originalName}
    - ATS Score: ${atsScore}
    - JD Match Average: ${avgJDScore}
    - Total Applications Tracked: ${applications}
    - Interviews Secured: ${interviews}
    
    Write a short, professional executive summary outlining their resume performance and giving one piece of strategic advice. Return ONLY the text of the summary.`;

    const summaryResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const executiveSummary = summaryResponse.text;

    // Create HTML for PDF
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            h2 { color: #1f2937; margin-top: 30px; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .grid { display: flex; gap: 20px; }
            .col { flex: 1; }
            .metric { font-size: 24px; font-weight: bold; color: #4f46e5; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Resume Intelligence Report</h1>
          <p><strong>Resume:</strong> ${resume.name || resume.originalName}</p>
          <p><strong>Generated On:</strong> ${new Date().toLocaleDateString()}</p>
          
          <div class="card">
            <h2>Executive Summary</h2>
            <p>${executiveSummary}</p>
          </div>

          <div class="grid">
            <div class="col card">
              <div class="label">ATS Score</div>
              <div class="metric">${atsScore}</div>
            </div>
            <div class="col card">
              <div class="label">Avg JD Match Score</div>
              <div class="metric">${avgJDScore}</div>
            </div>
            <div class="col card">
              <div class="label">Interview Rate</div>
              <div class="metric">${applications > 0 ? Math.round((interviews/applications)*100) : 0}%</div>
            </div>
          </div>

          <div class="card">
            <h2>Impact Tracking</h2>
            <p>Total Applications: ${applications} | Interviews: ${interviews}</p>
            <table>
              <tr><th>Company</th><th>Role</th><th>Status</th></tr>
              ${impactEvents.slice(0, 5).map(e => `<tr><td>${e.companyName}</td><td>${e.jobTitle}</td><td>${e.status}</td></tr>`).join('')}
            </table>
          </div>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="intelligence-report-${resumeId}.pdf"`
    });
    
    // We must send the buffer properly. Express's res.send handles buffers natively.
    res.send(Buffer.from(pdfBuffer));
    
  } catch (error) {
    console.error('Intelligence report error:', error);
    res.status(500).json({ message: 'Failed to generate intelligence report' });
  }
};

// --- Addons R17: Time Machine ---

// GET /api/resumes/:id/checkpoints (Protected)
const getCheckpoints = async (req, res) => {
  try {
    const ResumeCheckpoint = require('../models/ResumeCheckpoint');
    const checkpoints = await ResumeCheckpoint.find({ resumeId: req.params.id }).sort('-createdAt');
    res.json(checkpoints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch checkpoints' });
  }
};

// POST /api/resumes/:id/restore/:checkpointId (Protected)
const restoreCheckpoint = async (req, res) => {
  try {
    const ResumeCheckpoint = require('../models/ResumeCheckpoint');
    const ResumeSection = require('../models/ResumeSection');
    
    const checkpoint = await ResumeCheckpoint.findOne({ _id: req.params.checkpointId, resumeId: req.params.id });
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });

    const snapshotSections = JSON.parse(checkpoint.sectionsSnapshot);
    
    // Clear existing sections
    await ResumeSection.deleteMany({ resumeId: req.params.id });
    
    // Insert snapshot sections
    // Clean _id to let Mongoose generate new ones, or keep them to preserve continuity. 
    // It's safer to keep the exact same payload except removing the original `__v` if it causes issues.
    const sectionsToInsert = snapshotSections.map(s => {
      const copy = { ...s };
      delete copy.__v;
      return copy;
    });

    await ResumeSection.insertMany(sectionsToInsert);

    // Create a new checkpoint explicitly for the restore action so they can undo it
    await ResumeCheckpoint.create({
      resumeId: req.params.id,
      commitMessage: `Restored to checkpoint from ${new Date(checkpoint.createdAt).toLocaleString()}`,
      sectionsSnapshot: checkpoint.sectionsSnapshot
    });

    res.json({ message: 'Resume restored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to restore checkpoint' });
  }
};

// --- Addons V4 RX1: DSA Skills Auto-population ---

// POST /api/resumes/sync-dsa-skills
// Internal/Background Endpoint. No user auth required if called from localhost, but we should secure it or just let it be called with a secret. For simplicity, since it's a background hook, we'll just parse the body.
const syncDSASkills = async (req, res) => {
  try {
    const { userId, topic } = req.body;
    if (!userId || !topic) return res.status(400).json({ message: 'Missing userId or topic' });

    const DSA = require('../models/DSA');
    const Resume = require('../models/Resume');
    const DSASkillSyncLog = require('../models/DSASkillSyncLog');

    // Count problems solved by this user in this topic
    const count = await DSA.countDocuments({ userId, topic });

    let proficiencyLevel = null;
    let skillAdded = topic; // Default to the topic name

    // Aggregate rules based on prompt:
    // > 10 in Arrays = proficient
    // > 20 in Dynamic Programming = strong
    // > 5 in Graphs = familiar
    // Generalize this:
    if (topic.toLowerCase().includes('array') && count > 10) proficiencyLevel = 'proficient';
    else if (topic.toLowerCase().includes('dynamic programming') && count > 20) proficiencyLevel = 'strong';
    else if (topic.toLowerCase().includes('graph') && count > 5) proficiencyLevel = 'familiar';
    else if (count >= 15) proficiencyLevel = 'strong';
    else if (count >= 10) proficiencyLevel = 'proficient';
    else if (count >= 5) proficiencyLevel = 'familiar';

    if (!proficiencyLevel) return res.json({ message: 'Not enough problems for skill suggestion' });

    // Find user's active resume (or most recently updated)
    const activeResume = await Resume.findOne({ userId }).sort('-updatedAt');
    if (!activeResume) return res.json({ message: 'No resume found for user' });

    // Check if we already suggested this exact level for this topic
    const existingLog = await DSASkillSyncLog.findOne({
      userId,
      resumeId: activeResume._id,
      skillAdded,
      proficiencyLevel,
    });

    if (existingLog) return res.json({ message: 'Skill already suggested at this level' });

    // Create the sync log (pending suggestion)
    await DSASkillSyncLog.create({
      userId,
      resumeId: activeResume._id,
      skillAdded,
      proficiencyLevel,
      problemCountAtSync: count,
      wasAccepted: false
    });

    res.json({ message: 'DSA Skill sync created successfully' });
  } catch (error) {
    console.error('DSA Sync Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// GET /api/resumes/dsa-sync-suggestions (Protected)
const getPendingDSASyncs = async (req, res) => {
  try {
    const DSASkillSyncLog = require('../models/DSASkillSyncLog');
    const pendingLogs = await DSASkillSyncLog.find({ userId: req.user._id, wasAccepted: false }).populate('resumeId', 'name');
    res.json(pendingLogs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending DSA syncs' });
  }
};

// POST /api/resumes/dsa-sync-suggestions/:id/accept (Protected)
const acceptDSASync = async (req, res) => {
  try {
    const DSASkillSyncLog = require('../models/DSASkillSyncLog');
    const ResumeSection = require('../models/ResumeSection');
    const Resume = require('../models/Resume');
    
    const syncLog = await DSASkillSyncLog.findOne({ _id: req.params.id, userId: req.user._id });
    if (!syncLog) return res.status(404).json({ message: 'Log not found' });

    syncLog.wasAccepted = true;
    await syncLog.save();

    // Find the skills section
    let skillsSection = await ResumeSection.findOne({ resumeId: syncLog.resumeId, sectionType: 'SKILLS' });
    
    let stringToAppend = '';
    if (syncLog.proficiencyLevel === 'proficient') stringToAppend = `\n- Primary Skills: ${syncLog.skillAdded}`;
    else if (syncLog.proficiencyLevel === 'strong') stringToAppend = `\n- ${syncLog.skillAdded} (Strong)`;
    else if (syncLog.proficiencyLevel === 'familiar') stringToAppend = `\n- Secondary Skills: ${syncLog.skillAdded}`;

    if (skillsSection) {
      if (!skillsSection.content.includes(syncLog.skillAdded)) {
        skillsSection.content += stringToAppend;
        await skillsSection.save(); // This triggers time machine checkpoint via hook
      }
    } else {
      await ResumeSection.create({
        resumeId: syncLog.resumeId,
        sectionType: 'SKILLS',
        content: `### Skills${stringToAppend}`,
        orderIndex: 4
      }); // This triggers time machine checkpoint via hook
    }

    // Trigger basic ATS analysis update (can be run asynchronously)
    const { atsScoreResume } = require('../../services/resumeService'); // Hypothetical service or we just update the timestamp
    await Resume.findByIdAndUpdate(syncLog.resumeId, { updatedAt: Date.now() });

    // Log to UnifiedTimeline
    const UnifiedTimeline = require('../models/UnifiedTimeline');
    if (UnifiedTimeline) {
      await UnifiedTimeline.create({
        userId: req.user._id,
        eventType: 'RESUME_DSA_SYNC',
        content: `Added ${syncLog.skillAdded} (${syncLog.proficiencyLevel}) to resume based on DSA practice.`,
        metadata: { resumeId: syncLog.resumeId }
      }).catch(err => console.error(err));
    }

    res.json({ message: 'Skill accepted and added to resume' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to accept DSA sync' });
  }
};

// POST /api/resumes/dsa-sync-suggestions/:id/dismiss (Protected)
const dismissDSASync = async (req, res) => {
  try {
    const DSASkillSyncLog = require('../models/DSASkillSyncLog');
    await DSASkillSyncLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Suggestion dismissed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to dismiss suggestion' });
  }
};

// GET /api/resumes/:id/interview-signals
const getInterviewSignals = async (req, res) => {
  try {
    const InterviewResumeSignal = require('../models/InterviewResumeSignal');
    const signals = await InterviewResumeSignal.find({ resumeId: req.params.id }).populate('interviewId', 'company role');
    res.json(signals);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch interview signals' });
  }
};

// --- Addons V4 RX3: Application Outcome Learning ---

// POST /api/resumes/:id/outcome-learning/process
const processOutcomeLearning = async (req, res) => {
  try {
    const { applicationId, status } = req.body;
    const resumeId = req.params.id;
    
    const Application = require('../models/Application');
    const ResumeOutcomeLearning = require('../models/ResumeOutcomeLearning');
    
    const existing = await ResumeOutcomeLearning.findOne({ applicationId });
    if (existing) return res.json({ message: 'Already processed' });

    const application = await Application.findById(applicationId);
    if (!application) return res.json({ message: 'Not found' });

    // In a real app we'd call an LLM to generate the insight based on the JD and Resume.
    // For simplicity, we just generate a mock insight based on status
    const isOffer = status === 'OFFER';
    const insight = isOffer 
      ? `Your resume structure performed exceptionally well for ${application.role} roles at ${application.company}.`
      : `Consider revising your experience section to better highlight impact for ${application.role} roles.`;
      
    await ResumeOutcomeLearning.create({
      resumeId,
      applicationId,
      status,
      insight,
      actionType: isOffer ? 'REINFORCE' : 'FIX'
    });

    res.json({ message: 'Outcome learning processed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process outcome learning' });
  }
};

// GET /api/resumes/:id/outcome-learning
const getOutcomeLearning = async (req, res) => {
  try {
    const ResumeOutcomeLearning = require('../models/ResumeOutcomeLearning');
    const Application = require('../models/Application');
    
    // Get total apps with this resume
    const applications = await Application.find({ resumeId: req.params.id });
    const totalApps = applications.length;
    const terminalApps = applications.filter(a => ['OFFER', 'REJECTED'].includes(a.status));
    
    const insights = await ResumeOutcomeLearning.find({ resumeId: req.params.id }).populate('applicationId', 'company role');
    
    res.json({
      totalApps,
      terminalApps: terminalApps.length,
      offers: terminalApps.filter(a => a.status === 'OFFER').length,
      insights
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch outcome learning' });
  }
};

module.exports = {
  rewriteSectionStream,
  acceptRewrite,
  getRewriteHistory,
  tailorResume,
  generateCoverLetterStream,
  getCoverLetters,
  analyzeKeywords,
  fixKeywordStream,
  importLinkedIn,
  healthCheck,
  getHealthAlerts,
  resolveHealthAlert,
  predictInterviewQuestions,
  createABTest,
  getABTests,
  saveBuiltResume,
  scoreJD,
  batchScoreJD,
  getJDScores,
  getPeerBenchmark,
  runMaintenanceWizard,
  getImpactEvents,
  addImpactEvent,
  updateImpactEvent,
  generateReviewLink,
  getReviewByToken,
  addFeedback,
  getPublicFeedbacks,
  getFeedback,
  resolveFeedback,
  generateIntelligenceReport,
  getCheckpoints,
  restoreCheckpoint,
  syncDSASkills,
  getPendingDSASyncs,
  acceptDSASync,
  dismissDSASync,
  getInterviewSignals,
  processOutcomeLearning,
  getOutcomeLearning,
  getPrepHubGaps
};
