const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/genai');

const intelCache = new Map();

exports.lookupCompanies = (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.json([]);
  }

  const companiesPath = path.join(__dirname, '../data/companies.json');
  try {
    const data = JSON.parse(fs.readFileSync(companiesPath, 'utf8'));
    const matches = data.filter(c => c.name.toLowerCase().includes(query)).slice(0, 5);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to lookup companies' });
  }
};

exports.getCompanyIntel = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ message: 'Company name required' });

    if (intelCache.has(name.toLowerCase())) {
      const cached = intelCache.get(name.toLowerCase());
      if (cached.expiresAt > Date.now()) {
        return res.json(cached.data);
      }
    }

    const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Perform research on the company "${name}" for software engineering campus placements. Return ONLY valid JSON and nothing else.
    {
      "hiringProcess": "Brief description of typical fresher hiring rounds",
      "ctcRange": "Typical fresher CTC range",
      "difficulty": "Easy|Medium|Hard",
      "interviewTopics": ["topic1", "topic2"],
      "sentiment": "Positive|Mixed|Negative",
      "serviceAgreement": "Yes/No, details if any",
      "culture": "2 sentence summary of work culture"
    }`;

    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(aiResponse);

    intelCache.set(name.toLowerCase(), {
      data: parsed,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json(parsed);
  } catch (error) {
    console.error('Company Intel Error:', error);
    res.status(500).json({ message: error.message });
  }
};
