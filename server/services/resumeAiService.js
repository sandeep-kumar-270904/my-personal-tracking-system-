const { GoogleGenAI } = require('@google/genai');
const pdf = require('pdf-parse');
const fs = require('fs');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const extractTextFromPDF = async (filePath) => {
  try {
    let dataBuffer = fs.readFileSync(filePath);
    let data = await pdf(dataBuffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
};

const analyzeResumeWithAI = async (resumeText) => {
  const prompt = `
You are an expert Applicant Tracking System (ATS) and Senior Technical Recruiter. 
Analyze the following resume text and return a strictly valid JSON object (no markdown, no backticks).

Resume Text:
${resumeText}

Required JSON format:
{
  "atsScore": 85, // overall score 0-100
  "wordCount": 450,
  "skillsDetected": ["React", "Node.js", "AWS"],
  "missingCommonSkills": ["TypeScript", "Docker"],
  "experienceYears": 3,
  "educationDetected": {"degree": "B.S. Computer Science", "university": "State University"},
  "formattingIssues": ["Missing summary section", "Inconsistent date formats"],
  "keywordsFound": ["full-stack", "scalable", "optimized"],
  "suggestions": ["Add quantifiable metrics to your recent role", "Include a summary"]
}
`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let aiResponse = result.text;
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
};

const extractSectionsWithAI = async (resumeText) => {
  const prompt = `
Parse the following resume text into logical sections. 
Return a strictly valid JSON array of objects (no markdown, no backticks).
Valid section types are: EDUCATION, EXPERIENCE, PROJECTS, SKILLS, CERTIFICATIONS, ACHIEVEMENTS, SUMMARY, CUSTOM.

Resume Text:
${resumeText}

Required JSON format:
[
  { "type": "SUMMARY", "content": "Full stack developer with 3 years..." },
  { "type": "EXPERIENCE", "content": "Software Engineer at X..." }
]
`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let aiResponse = result.text;
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('AI Section Parsing Error:', error);
    throw error;
  }
};

const compareResumesWithAI = async (resume1Text, resume2Text) => {
  const prompt = `
Compare these two resumes. Return a short summary evaluating their strengths for technical roles.
Resume 1: ${resume1Text}
Resume 2: ${resume2Text}

Keep it to one short paragraph.
`;
  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return result.text;
  } catch (error) {
    console.error('AI Comparison Error:', error);
    return "Comparison failed.";
  }
};

module.exports = {
  extractTextFromPDF,
  analyzeResumeWithAI,
  extractSectionsWithAI,
  compareResumesWithAI
};
