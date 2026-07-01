const { GoogleGenerativeAI } = require('@google/generative-ai');
const ResourceChatLimit = require('../models/ResourceChatLimit');
const Resource = require('../models/Resource');

// Ensure dates are compared purely by YYYY-MM-DD
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatWithResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { message, history } = req.body;
    const userId = req.user.id;

    // 1. Check Limits (e.g. max 20 per day)
    const todayStr = formatDate();
    let usage = await ResourceChatLimit.findOne({ userId, date: todayStr });
    
    if (!usage) {
      usage = await ResourceChatLimit.create({ userId, date: todayStr, count: 0 });
    }

    if (usage.count >= 20) {
      return res.status(429).json({ message: 'Daily chat limit reached (20/20). Try again tomorrow.' });
    }

    // 2. Fetch Resource for context
    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // 3. Format history for Gemini
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `Act as an expert programming and computer science tutor. You are answering questions specifically about a study resource titled "${resource.title}", which is a ${resource.category} resource with ${resource.difficulty} difficulty. Description: ${resource.description}. Provide concise, helpful, and highly accurate answers.` }]
        },
        {
          role: "model",
          parts: [{ text: "I understand. I am ready to answer questions about this resource." }]
        },
        ...formattedHistory
      ]
    });

    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();

    // 4. Increment usage
    usage.count += 1;
    await usage.save();

    res.json({
      reply: aiResponse,
      usage: usage.count,
      maxUsage: 20
    });
  } catch (error) {
    console.error('Resource Chat Error:', error);
    res.status(500).json({ message: 'Failed to process chat request' });
  }
};

module.exports = {
  chatWithResource
};
