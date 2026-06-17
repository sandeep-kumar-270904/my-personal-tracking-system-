const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const Resume = require('../models/Resume');

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

module.exports = {
  analyzeJD,
  matchResume,
  generateEmail,
};
