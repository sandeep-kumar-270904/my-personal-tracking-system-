const Network = require('../models/Network');
const OutreachMessage = require('../models/OutreachMessage');
const NetworkingGoal = require('../models/NetworkingGoal');
const ReferralPipeline = require('../models/ReferralPipeline');
const NetworkingInsight = require('../models/NetworkingInsight');
const CompanyNetworkMap = require('../models/CompanyNetworkMap');
const MessageTemplate = require('../models/MessageTemplate');
const Application = require('../models/Application');
const { GoogleGenAI } = require('@google/genai');

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

const calcHealthScore = (contact, messages) => {
  let score = 0;
  if (contact.connectionStrength === 'CLOSE') score += 40;
  if (contact.connectionStrength === 'STRONG') score += 30;
  if (contact.connectionStrength === 'MODERATE') score += 15;
  if (contact.connectionStrength === 'WEAK') score += 5;

  if (contact.isReferralSource) score += 20;

  if (contact.lastInteractionAt) {
    const daysSince = (new Date() - new Date(contact.lastInteractionAt)) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) score += 20;
    else if (daysSince <= 30) score += 10;
    else if (daysSince <= 90) score += 5;
  }

  if (messages && messages.length > 0) {
    const responses = messages.filter(m => m.responseReceived).length;
    if (responses > 0) score += Math.min(20, responses * 5);
  }

  return Math.min(100, score);
};

exports.getContacts = async (req, res) => {
  try {
    const { search, connectionStrength, contactType, company, hasReferral, sortBy, sortOrder } = req.query;
    let query = { userId: req.user.id, isDeleted: false };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') },
        { role: new RegExp(search, 'i') }
      ];
    }
    if (connectionStrength) query.connectionStrength = connectionStrength;
    if (contactType) query.contactType = contactType;
    if (company) query.company = company;
    if (hasReferral === 'true') query.isReferralSource = true;

    let sortObj = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'relationshipHealth') sortObj.relationshipHealthScore = order;
    else if (sortBy === 'lastInteraction') sortObj.lastInteractionAt = order;
    else if (sortBy === 'company') sortObj.company = order;
    else sortObj.name = order;

    if (Object.keys(sortObj).length === 0) sortObj.updatedAt = -1;

    const contacts = await Network.find(query).sort(sortObj);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createContact = async (req, res) => {
  try {
    const contactData = { ...req.body, userId: req.user.id };
    contactData.relationshipHealthScore = calcHealthScore(contactData, []);
    
    // Check if company is in active applications
    if (contactData.company) {
      const activeApp = await Application.findOne({ userId: req.user.id, company: contactData.company });
      if (activeApp) {
        if (!contactData.tags) contactData.tags = [];
        contactData.tags.push('HIGH_PRIORITY');
      }
    }

    const contact = new Network(contactData);
    await contact.save();

    if (contact.company) {
      const cmap = await CompanyNetworkMap.findOne({ userId: req.user.id, company: contact.company });
      if (cmap) {
        cmap.contactCount += 1;
        if (contact.connectionStrength === 'STRONG' || contact.connectionStrength === 'CLOSE') {
          cmap.strongConnectionCount += 1;
        }
        cmap.lastUpdated = new Date();
        await cmap.save();
      } else {
        const activeApps = await Application.countDocuments({ userId: req.user.id, company: contact.company });
        await CompanyNetworkMap.create({
          userId: req.user.id,
          company: contact.company,
          contactCount: 1,
          strongConnectionCount: (contact.connectionStrength === 'STRONG' || contact.connectionStrength === 'CLOSE') ? 1 : 0,
          applicationCount: activeApps
        });
      }
    }

    res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const contact = await Network.findOne({ _id: req.params.id, userId: req.user.id, isDeleted: false });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    Object.assign(contact, req.body);
    if (req.body.lastInteractionAt || req.body.connectionStrength) {
      const msgs = await OutreachMessage.find({ contactId: contact._id });
      contact.relationshipHealthScore = calcHealthScore(contact, msgs);
    }

    if (req.body.referralStatus) {
      // Sync referral pipeline status
      const pipeline = await ReferralPipeline.findOne({ contactId: contact._id });
      if (pipeline) {
        if (req.body.referralStatus === 'AGREED') pipeline.status = 'RECEIVED';
        if (req.body.referralStatus === 'DECLINED') pipeline.status = 'DECLINED';
        await pipeline.save();
      }
    }

    await contact.save();
    res.json(contact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const contact = await Network.findOne({ _id: req.params.id, userId: req.user.id, isDeleted: false }).lean();
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    const messages = await OutreachMessage.find({ contactId: contact._id }).sort({ sentAt: -1 });
    const referralPipeline = await ReferralPipeline.find({ contactId: contact._id }).populate('applicationId');
    const applications = await Application.find({ userId: req.user.id, company: contact.company });

    res.json({ ...contact, messages, referralPipeline, applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Network.findOne({ _id: req.params.id, userId: req.user.id });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    contact.isDeleted = true;
    await contact.save();
    res.json({ message: 'Contact soft deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalContacts = await Network.countDocuments({ userId: req.user.id, isDeleted: false });
    
    const contactsByType = await Network.aggregate([
      { $match: { userId: req.user.id, isDeleted: false } },
      { $group: { _id: '$contactType', count: { $sum: 1 } } }
    ]);

    const messages = await OutreachMessage.find({ userId: req.user.id });
    const totalOutreachSent = messages.length;
    const respondedCount = messages.filter(m => m.responseReceived).length;
    const avgResponseRate = totalOutreachSent ? (respondedCount / totalOutreachSent) * 100 : 0;

    const referralsReceived = await ReferralPipeline.countDocuments({ userId: req.user.id, status: 'RECEIVED' });
    const companiesCovered = (await Network.distinct('company', { userId: req.user.id, isDeleted: false })).length;
    const strongConnections = await Network.countDocuments({ userId: req.user.id, isDeleted: false, connectionStrength: { $in: ['STRONG', 'CLOSE'] } });
    
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const weeklyGoalProgress = await NetworkingGoal.findOne({ userId: req.user.id, weekStartDate: { $lte: new Date(), $gte: startOfWeek } });

    res.json({
      totalContacts,
      contactsByType,
      avgResponseRate,
      totalOutreachSent,
      referralsReceived,
      companiesCovered,
      strongConnections,
      weeklyGoalProgress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateOutreach = async (req, res) => {
  try {
    const { contactId, messageType, channel, context } = req.body;
    const contact = await Network.findById(contactId);
    
    const prompt = `
      You are an expert networking assistant helping a student write a personalized outreach message.
      Write a professional but warm ${messageType} message to send via ${channel}.
      Contact details: Name: ${contact.name}, Role: ${contact.role}, Company: ${contact.company}.
      Additional context provided by user: ${context || 'None'}
      Return ONLY a JSON object: {"message": "The actual message string", "toneAssessment": "Brief tone feedback", "estimatedResponseProbability": 0.85}
    `;

    const aiRes = await callGemini(prompt);
    // Parse json
    let parsed;
    try {
      const match = aiRes.match(/\{.*\}/s);
      if(match) parsed = JSON.parse(match[0]);
      else parsed = JSON.parse(aiRes);
    } catch(e) {
      parsed = { message: aiRes, toneAssessment: 'Neutral', estimatedResponseProbability: 0.5 };
    }

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendOutreach = async (req, res) => {
  try {
    const { contactId, messageType, channel, messageContent, aiGenerated, sentAt } = req.body;
    const msg = new OutreachMessage({
      userId: req.user.id, contactId, messageType, channel, messageContent, aiGenerated, sentAt
    });
    await msg.save();

    const contact = await Network.findById(contactId);
    if(contact) {
      contact.lastInteractionAt = sentAt || new Date();
      // Schedule follow-up 7 days later
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      contact.nextFollowUpAt = nextDate;
      const allMsgs = await OutreachMessage.find({ contactId });
      contact.relationshipHealthScore = calcHealthScore(contact, allMsgs);
      
      if(contact.outreachStatus === 'NOT_CONTACTED') {
        contact.outreachStatus = 'MESSAGED';
      }
      await contact.save();
    }
    
    // Update goal
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    let goal = await NetworkingGoal.findOne({ userId: req.user.id, weekStartDate: { $gte: startOfWeek } });
    if(goal) {
      goal.outreachCompleted += 1;
      await goal.save();
    }

    res.status(201).json(msg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.logResponse = async (req, res) => {
  try {
    const { responseContent, responseReceivedAt } = req.body;
    const msg = await OutreachMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    msg.responseReceived = true;
    msg.responseContent = responseContent;
    msg.responseReceivedAt = responseReceivedAt || new Date();
    msg.responseTime = (new Date(msg.responseReceivedAt) - new Date(msg.sentAt)) / (1000 * 60 * 60);
    
    const aiRes = await callGemini(`Analyze the sentiment of this networking response: "${responseContent}". Return only POSITIVE, NEUTRAL, or NEGATIVE.`);
    const sentiment = aiRes.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(sentiment)) {
      msg.sentimentAnalysis = sentiment;
    }

    await msg.save();

    const contact = await Network.findById(msg.contactId);
    if(contact) {
      contact.outreachStatus = 'REPLIED';
      if(msg.sentimentAnalysis === 'POSITIVE' && contact.connectionStrength === 'WEAK') {
        contact.connectionStrength = 'MODERATE';
      }
      const allMsgs = await OutreachMessage.find({ contactId: contact._id });
      contact.relationshipHealthScore = calcHealthScore(contact, allMsgs);
      await contact.save();
    }

    res.json(msg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getReferralPipeline = async (req, res) => {
  try {
    const pipeline = await ReferralPipeline.find({ userId: req.user.id }).populate('contactId').populate('applicationId');
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReferralPipeline = async (req, res) => {
  try {
    const { contactId, applicationId, notes } = req.body;
    const entry = new ReferralPipeline({
      userId: req.user.id, contactId, applicationId, notes
    });
    
    // Generate draft
    const contact = await Network.findById(contactId);
    if(contact) {
      const aiRes = await callGemini(`Draft a short referral request message for a contact named ${contact.name} at ${contact.company}. Return just the message text.`);
      entry.requestMessage = aiRes.trim();
    }
    
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateReferralPipeline = async (req, res) => {
  try {
    const entry = await ReferralPipeline.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    res.json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCompanyMap = async (req, res) => {
  try {
    const map = await CompanyNetworkMap.find({ userId: req.user.id });
    res.json(map);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const insights = await NetworkingInsight.find({ userId: req.user.id, isDismissed: false }).sort({ priority: 1, generatedAt: -1 });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.analyzeNetworking = async (req, res) => {
  try {
    // Generate some insights
    const contacts = await Network.find({ userId: req.user.id, isDeleted: false });
    const apps = await Application.find({ userId: req.user.id });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newInsights = [];
    
    for (const c of contacts) {
      if (c.lastInteractionAt && c.lastInteractionAt < thirtyDaysAgo) {
        newInsights.push({
          userId: req.user.id,
          insightType: 'RELATIONSHIP_DECAY',
          content: `Your last interaction with ${c.name} was more than 30 days ago.`,
          actionableStep: 'Send a check-in message or share a relevant article.',
          priority: 'MEDIUM'
        });
      }
    }
    
    // Check coverage gap
    const companyContactsMap = {};
    contacts.forEach(c => { companyContactsMap[c.company] = true; });
    for (const app of apps) {
      if (!companyContactsMap[app.company]) {
        newInsights.push({
          userId: req.user.id,
          insightType: 'COMPANY_COVERAGE',
          content: `You have applied to ${app.company} but have zero contacts there.`,
          actionableStep: `Reach out to alumni or recruiters at ${app.company}.`,
          priority: 'HIGH'
        });
      }
    }

    // Insert new insights
    for(const ins of newInsights) {
      const exists = await NetworkingInsight.findOne({ userId: req.user.id, content: ins.content });
      if(!exists) {
        await NetworkingInsight.create(ins);
      }
    }
    
    res.json({ message: 'Analysis complete', insightsCount: newInsights.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await MessageTemplate.find({ userId: req.user.id }).sort({ responseRate: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = new MessageTemplate({ ...req.body, userId: req.user.id });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const contacts = await Network.find({ userId: req.user.id, isDeleted: false });
    const recommended = [];
    const today = new Date();
    
    contacts.forEach(c => {
      if(c.nextFollowUpAt && c.nextFollowUpAt <= today) {
        recommended.push({
          contact: c,
          actionType: 'Follow up',
          reason: 'Scheduled follow-up is due'
        });
      } else if (c.referralStatus === 'AGREED') {
        recommended.push({
          contact: c,
          actionType: 'Request referral',
          reason: 'Contact agreed to refer you, follow up on status'
        });
      } else if (c.connectionStrength === 'STRONG' && c.outreachStatus !== 'MESSAGED') {
        recommended.push({
          contact: c,
          actionType: 'Check in',
          reason: 'Maintain your strong connection'
        });
      }
    });

    res.json(recommended.slice(0, 3));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGoals = async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    let goal = await NetworkingGoal.findOne({ userId: req.user.id, weekStartDate: { $gte: startOfWeek } });
    if (!goal) {
      goal = new NetworkingGoal({ userId: req.user.id, weekStartDate: startOfWeek });
      await goal.save();
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateGoals = async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const goal = await NetworkingGoal.findOneAndUpdate(
      { userId: req.user.id, weekStartDate: { $gte: startOfWeek } },
      req.body,
      { new: true, upsert: true }
    );
    res.json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- ADDON A: LinkedIn Import ---

const levenshteinDistance = (s, t) => {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] =
        i === 0
          ? j
          : Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
            );
    }
  }
  return arr[t.length][s.length];
};

exports.importDeduplication = async (req, res) => {
  try {
    const importedContacts = req.body.contacts; // Array of parsed contacts
    const existingContacts = await Network.find({ userId: req.user.id, isDeleted: false });

    const exactMatches = [];
    const probableMatches = [];
    const newContacts = [];

    importedContacts.forEach((imported, index) => {
      imported.importId = index;
      let matched = false;
      const importedName = (imported.firstName + ' ' + imported.lastName).toLowerCase().trim();
      const importedCompany = (imported.company || '').toLowerCase().trim();

      for (const existing of existingContacts) {
        const existingName = (existing.name || existing.firstName + ' ' + existing.lastName || '').toLowerCase().trim();
        const existingCompany = (existing.company || '').toLowerCase().trim();

        const nameDistance = levenshteinDistance(importedName, existingName);
        
        if (nameDistance <= 1 && importedCompany === existingCompany) {
          exactMatches.push({ imported, existing });
          matched = true;
          break;
        } else if (nameDistance <= 2) {
          probableMatches.push({ imported, existing });
          matched = true;
          break;
        }
      }

      if (!matched) {
        newContacts.push(imported);
      }
    });

    res.json({ exactMatches, probableMatches, newContacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkCreateContacts = async (req, res) => {
  try {
    const { contacts } = req.body;
    
    const preparedContacts = contacts.map(c => {
      const newContact = {
        userId: req.user.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.company,
        role: c.role || c.position,
        email: c.email,
        contactType: c.contactType || 'ENGINEER',
        connectionStrength: 'WEAK',
        howMet: 'LinkedIn connection',
        lastInteractionAt: c.connectedOn ? new Date(c.connectedOn) : new Date(),
        relationshipHealthScore: 5 // initial WEAK score
      };
      return newContact;
    });

    const inserted = await Network.insertMany(preparedContacts);

    // Update CompanyNetworkMaps
    const companies = [...new Set(preparedContacts.map(c => c.company).filter(Boolean))];
    for (const comp of companies) {
      const activeApps = await Application.countDocuments({ userId: req.user.id, company: comp });
      const contactCount = await Network.countDocuments({ userId: req.user.id, company: comp, isDeleted: false });
      
      await CompanyNetworkMap.findOneAndUpdate(
        { userId: req.user.id, company: comp },
        { 
          userId: req.user.id, 
          company: comp, 
          contactCount: contactCount,
          applicationCount: activeApps,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ message: 'Bulk imported successfully', count: inserted.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ADDON B: URL Enrichment ---

exports.enrichContact = async (req, res) => {
  try {
    const { profileText } = req.body;
    if (!profileText) return res.status(400).json({ message: 'Profile text is required' });

    const prompt = `
      Extract the following fields from this raw LinkedIn profile text and return them as a strict JSON object. Do not include markdown formatting.
      Fields to extract: firstName, lastName, currentRole, currentCompany, previousCompanies (array of strings), college, graduationYear (number), yearsOfExperience (number), bioSummary.
      If a field is not found, leave it null.
      
      Raw text:
      """
      ${profileText}
      """
    `;

    const aiRes = await callGemini(prompt);
    let parsed;
    try {
      const match = aiRes.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : aiRes);
    } catch(e) {
      console.error("Enrichment parsing error", e, aiRes);
      return res.status(500).json({ message: 'Failed to parse AI response' });
    }

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
// --- ADDON D: AI Weekly Brief ---

const WeeklyBrief = require('../models/WeeklyBrief');

exports.generateWeeklyBrief = async (req, res) => {
  try {
    const userId = req.user.id || req.body.userId;
    const weekStartDate = new Date();
    weekStartDate.setHours(0,0,0,0);
    weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay()); // Sunday

    // Assemble week's data
    const newContacts = await Network.countDocuments({ userId, createdAt: { $gte: weekStartDate } });
    const weekMessages = await OutreachMessage.find({ userId, sentAt: { $gte: weekStartDate } });
    const messagesSent = weekMessages.length;
    const responses = weekMessages.filter(m => m.responseReceived).length;
    const responseRate = messagesSent > 0 ? Math.round((responses / messagesSent) * 100) : 0;
    
    // Last week data
    const lastWeekStart = new Date(weekStartDate);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekMessages = await OutreachMessage.find({ userId, sentAt: { $gte: lastWeekStart, $lt: weekStartDate } });
    const lastWeekResponses = lastWeekMessages.filter(m => m.responseReceived).length;
    const lastWeekResponseRate = lastWeekMessages.length > 0 ? Math.round((lastWeekResponses / lastWeekMessages.length) * 100) : 0;

    // Top contacts
    const topContacts = await Network.find({ userId, isDeleted: false })
      .sort({ relationshipHealthScore: -1 })
      .limit(3)
      .select('name company relationshipHealthScore lastInteractionAt referralStatus');

    const prompt = `
      You are an AI networking coach. Generate a 200-word personalized weekly brief for a student.
      Use a conversational, encouraging tone. Format with bold numbers and bullet points if needed.

      Data for this week:
      - Messages sent: ${messagesSent}
      - Response rate: ${responseRate}% (vs ${lastWeekResponseRate}% last week)
      - New contacts added: ${newContacts}
      - Top contacts: ${JSON.stringify(topContacts)}

      Give them a quick summary of their week, highlight the response rate trend, and suggest one specific focus for next week based on the top contacts (e.g., following up, asking for referrals). Do not use markdown headers, just paragraphs and bold text.
    `;

    const aiRes = await callGemini(prompt);

    const brief = await WeeklyBrief.findOneAndUpdate(
      { userId, weekStartDate },
      { briefContent: aiRes.trim() },
      { upsert: true, new: true }
    );

    res.json(brief);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrentWeeklyBrief = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const brief = await WeeklyBrief.findOne({ 
      userId: req.user.id, 
      isDismissed: false,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 });

    res.json(brief || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.dismissWeeklyBrief = async (req, res) => {
  try {
    const brief = await WeeklyBrief.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDismissed: true },
      { new: true }
    );
    res.json(brief);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ADDON E: Batch Outreach ---

exports.batchGenerateOutreach = async (req, res) => {
  try {
    const { contactIds, messageType, channel } = req.body;
    
    const contacts = await Network.find({ _id: { $in: contactIds }, userId: req.user.id });
    
    // Process in parallel
    const results = await Promise.all(contacts.map(async (contact) => {
      const prompt = `
        You are drafting a short networking message.
        Tone: Professional but friendly.
        Channel: ${channel}
        Type: ${messageType}
        Target Contact: ${contact.name}, ${contact.role} at ${contact.company}.
        Generate just the message text. Do not include subject lines unless it's an email. Make it personalized to their role and company.
      `;
      try {
        const msg = await callGemini(prompt);
        return {
          contactId: contact._id,
          contactName: contact.name,
          contactCompany: contact.company,
          message: msg.trim(),
          estimatedResponseProbability: Math.floor(Math.random() * 40) + 40 // Dummy 40-80%
        };
      } catch (err) {
        return {
          contactId: contact._id,
          contactName: contact.name,
          contactCompany: contact.company,
          message: 'Error generating message.',
          error: true
        };
      }
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkSendOutreach = async (req, res) => {
  try {
    const { messages } = req.body; // Array of {contactId, messageContent, channel, messageType, aiGenerated}
    
    const preparedMessages = messages.map(m => ({
      ...m,
      userId: req.user.id,
      sentAt: new Date()
    }));

    await OutreachMessage.insertMany(preparedMessages);

    // Bulk update contacts
    const contactIds = messages.map(m => m.contactId);
    
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 7);

    await Network.updateMany(
      { _id: { $in: contactIds }, userId: req.user.id },
      { 
        $set: { 
          lastInteractionAt: new Date(),
          nextFollowUpAt: nextFollowUp,
          outreachStatus: 'MESSAGED'
        } 
      }
    );

    res.status(201).json({ message: 'Messages logged and follow-ups scheduled', count: messages.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ADDON F: Alumni Engine ---

exports.getAlumniSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const contacts = await Network.find({ userId, isDeleted: false });
    const companyCounts = {};
    const alumniByCompany = {};

    contacts.forEach(c => {
      if (c.company) {
        companyCounts[c.company] = (companyCounts[c.company] || 0) + 1;
        if (c.contactType === 'ALUMNI' || c.contactType === 'SENIOR_STUDENT') {
          if (!alumniByCompany[c.company]) alumniByCompany[c.company] = [];
          alumniByCompany[c.company].push(c);
        }
      }
    });

    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => company);

    const suggestions = topCompanies.map(company => {
      const existingAlumni = alumniByCompany[company] || [];
      return {
        company,
        totalContacts: companyCounts[company],
        alumniContacts: existingAlumni.map(a => ({ _id: a._id, name: a.name, role: a.role })),
        needsAlumni: existingAlumni.length === 0,
        searchQuery: `site:linkedin.com/in "${company}" "Software Engineer" "${req.user.college || 'University'}"`
      };
    });

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ADDON G: Intro Requests ---

exports.generateIntroRequest = async (req, res) => {
  try {
    const { targetContactId, introducerId } = req.body;
    
    const target = await Network.findOne({ _id: targetContactId, userId: req.user.id });
    const introducer = await Network.findOne({ _id: introducerId, userId: req.user.id });
    
    if (!target || !introducer) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const prompt = `
      You are drafting an email/message to ask a mutual connection for an introduction.
      Tone: Professional, polite, low-pressure.
      
      Introducer (the person you are writing to): ${introducer.name}, ${introducer.role} at ${introducer.company}.
      Target (the person you want to meet): ${target.name}, ${target.role} at ${target.company}.
      
      Draft a short message asking ${introducer.name} if they'd be open to making an intro to ${target.name}. 
      Include a brief reason: to learn more about the engineering team/culture at ${target.company}.
    `;

    const msg = await callGemini(prompt);
    
    res.json({ message: msg.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
}
