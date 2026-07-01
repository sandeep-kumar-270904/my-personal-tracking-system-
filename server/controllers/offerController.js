const Offer = require('../models/Offer');
const { syncEventFromSource, removeEventForSource } = require('../utils/calendarSync');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    Get all offers for a user
// @route   GET /api/offers
// @access  Private
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ userId: req.user.id })
      .populate('referred_by_contact_id', 'name company role')
      .sort('-createdAt');
    
    // Auto-expire logic: if deadline passed and status is pending, set to expired
    let updated = false;
    const now = new Date();
    
    const processedOffers = await Promise.all(offers.map(async (offer) => {
      if (offer.status === 'pending_decision' && offer.decision_deadline && new Date(offer.decision_deadline) < now) {
        offer.status = 'expired';
        await offer.save();
        await syncEventFromSource('offer', offer);
        updated = true;
        return offer;
      }
      return offer;
    }));

    res.json(processedOffers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private
const createOffer = async (req, res) => {
  try {
    const offerData = { ...req.body, userId: req.user.id };
    
    const offer = await Offer.create(offerData);
    if (offer.decision_deadline) {
      await syncEventFromSource('offer', offer);
    }

    res.status(201).json(offer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an offer
// @route   PUT /api/offers/:id
// @access  Private
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Handle v3 Revisions
    if (req.body.isRevision && req.body.revisionReason) {
      const revision = {
        revised_ctc_annual: offer.ctc_annual,
        revised_base_salary: offer.base_salary,
        revised_joining_bonus: offer.joining_bonus,
        reason: req.body.revisionReason,
        revision_date: new Date()
      };
      
      // We push the *old* values as the "revision history", 
      // or we push the *new* values? 
      // "Original: X -> Revised: Y". It's easier if `revisions` stores the *new* revisions, or the *history* of what it was. 
      // The prompt says "revised_ctc_annual... reason". So we can just push the new values.
      
      req.body.revisions = offer.revisions || [];
      req.body.revisions.push({
        revised_ctc_annual: req.body.ctc_annual,
        revised_base_salary: req.body.base_salary,
        revised_joining_bonus: req.body.joining_bonus,
        reason: req.body.revisionReason,
        revision_date: new Date()
      });
    }

    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (updatedOffer) {
      await syncEventFromSource('offer', updatedOffer);
    }

    res.json(updatedOffer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await offer.deleteOne();
    await removeEventForSource('offer', req.params.id);
    res.json({ message: 'Offer removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const Resume = require('../models/Resume');
const ResumeSection = require('../models/ResumeSection');

// @desc    Generate resume leverage points for offer negotiation
// @route   POST /api/offers/:id/resume-leverage
// @access  Private
const analyzeOfferLeverage = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId });
    const fullResumeText = sections.map(s => `[${s.heading}]\n${s.content}`).join('\n\n');

    const prompt = `You are an expert tech recruiter and salary negotiator. 
    Analyze this candidate's resume against the role they received an offer for.
    Offer Role: ${offer.role_title} at ${offer.company_name}
    Offer Compensation: Base ${offer.base_salary || 0}, CTC ${offer.ctc_annual || 0}
    
    Resume content:
    ${fullResumeText}

    Find 3 specific "leverage points" the candidate can use to negotiate a higher offer. 
    Look for things where the candidate OVERQUALIFIES for standard expectations (e.g. they have more years of experience, a rarer tech stack, or led projects of unusually high impact/scale).
    
    Return ONLY a JSON array of strings, like this:
    [
      "You have 3 AWS projects but the role only strictly requires 1. Use this to negotiate a higher base.",
      "Your experience leading a 5-person team demonstrates leadership potential beyond a standard SWE role."
    ]`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const leveragePoints = JSON.parse(response.text);

    res.json({ leveragePoints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to analyze leverage' });
  }
};

// @desc    Upload offer document
// @route   POST /api/offers/:id/upload-document
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Usually we might upload to S3, but for local we'll save the path
    offer.offer_document_url = `/uploads/offers/${req.file.filename}`;
    await offer.save();

    res.json(offer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add negotiation log entry
// @route   POST /api/offers/:id/negotiation-log
// @access  Private
const addNegotiationLog = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const { note } = req.body;
    if (!note) return res.status(400).json({ message: 'Note is required' });

    offer.negotiationLog.push({ note, date: new Date() });
    await offer.save();

    res.json(offer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Generate decline offer email draft
// @route   POST /api/offers/:id/decline-draft
// @access  Private
const generateDeclineDraft = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const prompt = `You are a career advisor helping a student decline a job offer graciously. 
    The student needs to decline the offer for the role of ${offer.role_title} at ${offer.company_name}.
    
    Draft a polite, professional, and gracious email that the student can send to the recruiter. 
    Keep it relatively short, express gratitude for the opportunity and their time, state that after careful consideration they have decided to accept another offer that better aligns with their current career goals, and leave the door open for future opportunities.
    Do NOT include any placeholders like [Your Name] or [Recruiter Name] — just use generic sign-offs or leave it clean so the student can just fill it in.
    
    Output ONLY the email body.`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ draft: response.text.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error generating draft' });
  }
};

// @desc    Get CTC Benchmarks
// @route   GET /api/offers/benchmarks
// @access  Private
const getBenchmarks = async (req, res) => {
  try {
    const { role_title } = req.query;
    if (!role_title) return res.status(400).json({ message: 'Role title required' });

    // Find all offers with similar role title (case-insensitive)
    const regex = new RegExp(role_title, 'i');
    const offers = await Offer.find({ role_title: regex, ctc_annual: { $gt: 0 } }).select('ctc_annual');

    // Minimum cohort size of 5 for privacy
    if (offers.length < 5) {
      return res.json({ available: false, message: 'Not enough data for this role to ensure privacy.' });
    }

    const ctcs = offers.map(o => o.ctc_annual).sort((a, b) => a - b);
    
    // Calculate P25, Median (P50), and P75
    const p25 = ctcs[Math.floor(ctcs.length * 0.25)];
    const median = ctcs[Math.floor(ctcs.length * 0.5)];
    const p75 = ctcs[Math.floor(ctcs.length * 0.75)];

    res.json({
      available: true,
      count: offers.length,
      p25,
      median,
      p75
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching benchmarks' });
  }
};

// @desc    Add Post-Acceptance Task
// @route   POST /api/offers/:id/tasks
// @access  Private
const addPostAcceptanceTask = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    offer.postAcceptanceTasks.push(req.body);
    await offer.save();
    
    const newTask = offer.postAcceptanceTasks[offer.postAcceptanceTasks.length - 1];

    if (newTask.due_date) {
      await syncEventFromSource('post_acceptance_task', newTask, offer);
    }

    res.json(offer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error adding task' });
  }
};

// @desc    Update Post-Acceptance Task
// @route   PUT /api/offers/:id/tasks/:taskId
// @access  Private
const updatePostAcceptanceTask = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const task = offer.postAcceptanceTasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.set(req.body);
    await offer.save();

    if (task.due_date) {
      await syncEventFromSource('post_acceptance_task', task, offer);
    }

    res.json(offer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating task' });
  }
};

// @desc    Generate referral thank you draft
// @route   POST /api/offers/:id/thank-you-draft
// @access  Private
const generateThankYouDraft = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('referred_by_contact_id');
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    if (!offer.referred_by_contact_id) {
      return res.status(400).json({ message: 'No referral contact linked to this offer' });
    }

    const contact = offer.referred_by_contact_id;
    const prompt = `You are helping a student write a short, gracious thank-you message to someone who referred them for a job.
    The student just accepted an offer for the role of ${offer.role_title} at ${offer.company_name}.
    The person who referred them is named ${contact.name} (Role: ${contact.role || 'Professional'} at ${contact.company || offer.company_name}).
    
    Draft a polite, professional, and warm message expressing gratitude for their referral and guidance. 
    Keep it relatively short (3-4 sentences max). Do NOT include any placeholders like [Your Name] — leave it clean so the student can just fill it in.
    
    Output ONLY the message body.`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ draft: response.text.trim() });
  } catch (error) {
    console.error('Error generating thank you draft:', error);
    res.status(500).json({ message: 'Failed to generate thank you draft' });
  }
};

// @desc    Extract data from offer letter document
// @route   POST /api/offers/extract-document
// @access  Private
const extractDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a document' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    
    let textToParse = '';
    try {
      const data = await pdfParse(dataBuffer);
      textToParse = data.text;
    } catch (e) {
      // Fallback if not PDF or parsing fails
      textToParse = dataBuffer.toString('utf-8');
    }

    // Clean up uploaded file since it's just for extraction
    fs.unlinkSync(req.file.path);

    const prompt = `You are an AI assistant helping a student parse their job offer letter.
Extract the following information from the text of the offer letter below.
Return ONLY a valid JSON object matching this exact structure (no markdown tags, no backticks).
If a value is not found, leave it empty (string) or null (number).

{
  "company_name": "string",
  "role_title": "string",
  "ctc_annual": number,
  "base_salary": number,
  "variable_bonus": number,
  "joining_bonus": number,
  "decision_deadline": "YYYY-MM-DD",
  "has_bond": boolean,
  "bond_duration_months": number,
  "bond_penalty_amount": number,
  "probation_period_months": number
}

Offer Letter Text:
${textToParse.substring(0, 10000)}
`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let cleanText = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanText);

    res.json({ extracted: parsedData });
  } catch (error) {
    console.error('Error extracting document:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to extract document data' });
  }
};

module.exports = {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  analyzeOfferLeverage,
  uploadDocument,
  addNegotiationLog,
  generateDeclineDraft,
  getBenchmarks,
  addPostAcceptanceTask,
  updatePostAcceptanceTask,
  generateThankYouDraft,
  extractDocument
};
