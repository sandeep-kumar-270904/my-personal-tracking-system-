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
    let jsonString = aiResponse.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
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
    
    let jsonString = aiResponse.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    const result = JSON.parse(jsonString);
    res.status(200).json({
      resumeName: primaryResume.originalName,
      analysis: result
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to match resume', error: error.message });
  }
};

module.exports = {
  analyzeJD,
  matchResume,
};
