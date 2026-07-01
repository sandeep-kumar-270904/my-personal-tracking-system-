const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const Resume = require('../models/Resume');
const prepHubSyncService = require('../services/prepHubSyncService');

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to interact with Gemini
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

// @desc    Analyze Job Description
// @route   POST /api/ai/analyze-jd
// @access  Private
const analyzeJD = async (req, res) => {
  try {
    const { jdText } = req.body;
    
    if (!jdText) {
      return res.status(400).json({ message: 'Please provide a job description' });
    }

    const prompt = `
      You are an expert technical recruiter and ATS software. Analyze the following Job Description.
      Extract the following information and return ONLY a valid JSON object without any markdown block formatting like \`\`\`json.
      
      Schema:
      {
        "role": "The job title or primary role",
        "companyFocus": "A brief 1-2 sentence summary of what the company does or their primary focus based on the JD",
        "keySkills": ["skill1", "skill2", "skill3"],
        "niceToHaveSkills": ["skill1", "skill2"],
        "experienceLevel": "e.g., Entry-level, Mid-level, Senior",
        "summary": "A 2-3 sentence summary of the core responsibilities"
      }

      Job Description:
      """
      ${jdText}
      """
    `;

    const aiResponse = await callGemini(prompt);
    
    // Clean up potential markdown formatting from AI response
    let jsonString = aiResponse;
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      jsonString = match[0];
    }

    const result = JSON.parse(jsonString);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to analyze JD', error: error.message });
  }
};

// @desc    Compare Resume against JD
// @route   POST /api/ai/match-resume
// @access  Private
const matchResume = async (req, res) => {
  try {
    const { jdText } = req.body;

    if (!jdText) {
      return res.status(400).json({ message: 'Please provide a job description' });
    }

    // 1. Fetch user's primary resume
    const primaryResume = await Resume.findOne({ user: req.user._id, isPrimary: true });
    
    if (!primaryResume) {
      return res.status(404).json({ message: 'No primary resume found. Please upload one in the Resumes page and set it as primary.' });
    }

    // 2. Read and parse the PDF
    const fullPath = path.join(__dirname, '../', primaryResume.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Resume file not found on server.' });
    }

    const dataBuffer = fs.readFileSync(fullPath);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;

    // 3. Ask Gemini to compare
    const prompt = `
      You are an expert technical recruiter and ATS system. Compare the provided Candidate Resume against the Job Description.
      Provide a highly critical and constructive gap analysis. 
      Return ONLY a valid JSON object without any markdown block formatting like \`\`\`json.

      Schema:
      {
        "matchScore": <number between 0 and 100>,
        "matchedSkills": ["skill1", "skill2"],
        "missingSkills": ["skill1", "skill2"],
        "strengths": ["point1", "point2"],
        "tailoringSuggestions": [
          "Suggest a specific bullet point change to better highlight a matched skill",
          "Suggest how to address a missing skill"
        ]
      }

      Job Description:
      """
      ${jdText}
      """

      Candidate Resume:
      """
      ${resumeText}
      """
    `;

    const aiResponse = await callGemini(prompt);
    
    let jsonString = aiResponse;
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      jsonString = match[0];
    }

    const result = JSON.parse(jsonString);
    
    // Pipe AI data to PrepHub recommendation invalidation
    await prepHubSyncService.onAIAnalyzerReport(req.user._id);

    res.status(200).json({
      resumeName: primaryResume.originalName,
      analysis: result
    });
  } catch (error) {
    console.error("Match Resume Error:", error);
    res.status(500).json({ message: 'Failed to match resume', error: error.message });
  }
};

// @desc    Generate Cold Email
// @route   POST /api/ai/generate-email
// @access  Private
const generateEmail = async (req, res) => {
  try {
    const { contactName, role, company, contextText } = req.body;

    if (!contactName || !company) {
      return res.status(400).json({ message: 'Contact name and company are required' });
    }

    // 1. Fetch user's primary resume
    const primaryResume = await Resume.findOne({ user: req.user._id, isPrimary: true });
    let resumeText = '';

    if (primaryResume) {
      const fullPath = path.join(__dirname, '../', primaryResume.filePath);
      if (fs.existsSync(fullPath)) {
        const dataBuffer = fs.readFileSync(fullPath);
        const pdfData = await pdf(dataBuffer);
        resumeText = pdfData.text;
      }
    }

    const prompt = `
      You are an expert career coach and executive assistant. Write a highly professional, concise, and compelling cold outreach email.
      
      Target Recipient:
      Name: ${contactName}
      Role: ${role || 'Hiring Manager / Recruiter'}
      Company: ${company}

      Context / Job Description:
      """
      ${contextText || 'I am interested in exploring opportunities at your company.'}
      """

      Candidate Resume Context (Use this to highlight 1-2 highly relevant achievements or skills):
      """
      ${resumeText || 'No resume provided.'}
      """

      Requirements:
      1. Tone must be strictly professional, respectful, and confident.
      2. Keep it concise (under 150 words).
      3. Do NOT use overly casual language.
      4. Include a strong hook, a brief value proposition based on the resume, and a clear call to action (e.g., a brief chat).
      5. Output ONLY the email content (no surrounding markdown, no explanations). Include the Subject Line at the top like "Subject: ...".
    `;

    const aiResponse = await callGemini(prompt);
    
    res.status(200).json({ emailDraft: aiResponse.trim() });
  } catch (error) {
    console.error("Generate Email Error:", error);
    res.status(500).json({ message: 'Failed to generate email', error: error.message });
  }
};

// @desc    Generate Cover Letter
// @route   POST /api/ai/generate-cover-letter
// @access  Private
const generateCoverLetter = async (req, res) => {
  try {
    const { jdText, context } = req.body;

    // 1. Fetch user's primary resume
    const primaryResume = await Resume.findOne({ user: req.user._id, isPrimary: true });
    let resumeText = '';

    if (primaryResume) {
      const fullPath = path.join(__dirname, '../', primaryResume.filePath);
      if (fs.existsSync(fullPath)) {
        const dataBuffer = fs.readFileSync(fullPath);
        const pdfData = await pdf(dataBuffer);
        resumeText = pdfData.text;
      }
    }

    const prompt = `
      You are an expert career coach and professional copywriter. Write a highly professional, tailored cover letter.
      
      Job Description:
      """
      ${jdText || 'No specific job description provided. Use context below.'}
      """

      Additional Context / Application Details:
      """
      ${context || 'No additional context provided.'}
      """

      Candidate Resume Context (Use this to highlight relevant achievements or skills):
      """
      ${resumeText || 'No resume provided.'}
      """

      Requirements:
      1. Tone must be professional, confident, and engaging.
      2. Keep it concise (3-4 short paragraphs).
      3. It must have a standard business letter format (Greeting, Body, Conclusion, Sign-off).
      4. Highlight why the candidate is a strong fit based on the resume and the JD/context.
      5. Output ONLY the cover letter content (no surrounding markdown).
    `;

    const aiResponse = await callGemini(prompt);
    
    res.status(200).json({ coverLetter: aiResponse.trim() });
  } catch (error) {
    console.error("Generate Cover Letter Error:", error);
    res.status(500).json({ message: 'Failed to generate cover letter', error: error.message });
  }
};

// @desc    Evaluate Mock Interview Answer
// @route   POST /api/ai/mock-interview-eval
// @access  Private
const evaluateMockAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Both question and answer are required' });
    }

    const prompt = `
      You are an expert technical recruiter evaluating a candidate's verbal response to an interview question.
      
      Question: "${question}"
      Candidate's Transcription: "${answer}"

      Evaluate the answer and provide actionable feedback. Focus on clarity, conciseness, and the STAR method (Situation, Task, Action, Result).
      Return ONLY a valid JSON object without any markdown block formatting like \`\`\`json.

      Schema:
      {
        "score": <number between 0 and 100>,
        "feedback": "A brief, 2-3 sentence overall evaluation",
        "strengths": ["point1", "point2"],
        "improvements": ["point1", "point2"]
      }
    `;

    const aiResponse = await callGemini(prompt);
    
    let jsonString = aiResponse;
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      jsonString = match[0];
    }

    const result = JSON.parse(jsonString);
    
    // Pipe AI data to PrepHub recommendation invalidation
    await prepHubSyncService.onAIAnalyzerReport(req.user._id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Evaluate Mock Answer Error:", error);
    res.status(500).json({ message: 'Failed to evaluate mock answer', error: error.message });
  }
};

// @desc    Salary Negotiation Simulator
// @route   POST /api/ai/negotiate
// @access  Private
const negotiateSalary = async (req, res) => {
  try {
    const { history, currentMessage, offerDetails } = req.body;

    if (!currentMessage) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const { company, role, baseSalary } = offerDetails || { company: 'Tech Corp', role: 'Software Engineer', baseSalary: '$100,000' };

    const prompt = `
      You are an HR Recruiter at ${company} negotiating an offer with a candidate for the ${role} position.
      The initial base salary offer is ${baseSalary}.
      
      Personality & Rules:
      1. You are professional but firm. You want to close the candidate but you have budget constraints.
      2. If the candidate asks for a reasonable increase (e.g., 5-10%), you might concede slightly or offer a sign-on bonus or extra equity instead.
      3. If they ask for something absurd (e.g., double the salary), you must push back hard and act slightly surprised.
      4. If they provide strong data (market rate, competing offers), you are more likely to yield.
      5. Keep your responses relatively short (2-4 sentences max) like a real chat message.
      
      Chat History:
      ${history.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Recruiter'}: ${msg.content}`).join('\n')}
      
      Candidate's Latest Message: "${currentMessage}"

      Respond as the Recruiter.
    `;

    const aiResponse = await callGemini(prompt);
    
    res.status(200).json({ reply: aiResponse.trim() });
  } catch (error) {
    console.error("Negotiation Error:", error);
    res.status(500).json({ message: 'Failed to process negotiation', error: error.message });
  }
};

module.exports = {
  analyzeJD,
  matchResume,
  generateEmail,
  generateCoverLetter,
  evaluateMockAnswer,
  negotiateSalary,
  callGemini,
};
