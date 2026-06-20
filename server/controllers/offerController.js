const Offer = require('../models/Offer');
const { syncEventFromSource, removeEventForSource } = require('../utils/calendarSync');

// @desc    Get all offers for a user
// @route   GET /api/offers
// @access  Private
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ user: req.user.id }).sort('-createdAt');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private
const createOffer = async (req, res) => {
  try {
    const { company, role, baseSalary, signOnBonus, rsu, deadline, status, notes } = req.body;
    
    const offer = await Offer.create({
      user: req.user.id,
      company,
      role,
      baseSalary: Number(baseSalary),
      signOnBonus: Number(signOnBonus || 0),
      rsu: Number(rsu || 0),
      deadline,
      status,
      notes
    });

    await syncEventFromSource('offer', offer);

    res.status(201).json(offer);
  } catch (error) {
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

    if (offer.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
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

    if (offer.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await offer.deleteOne();
    await removeEventForSource('offer', req.params.id);
    res.json({ message: 'Offer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { GoogleGenAI } = require('@google/genai');
const Resume = require('../models/Resume');
const ResumeSection = require('../models/ResumeSection');

// @desc    Generate resume leverage points for offer negotiation
// @route   POST /api/offers/:id/resume-leverage
// @access  Private
const analyzeOfferLeverage = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (offer.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    // The frontend should pass the resumeId we want to use for leverage
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const sections = await ResumeSection.find({ resumeId });
    const fullResumeText = sections.map(s => `[${s.heading}]\n${s.content}`).join('\n\n');

    const prompt = `You are an expert tech recruiter and salary negotiator. 
    Analyze this candidate's resume against the role they received an offer for.
    Offer Role: ${offer.role} at ${offer.company}
    Offer Compensation: Base ${offer.baseSalary || 0}, Sign-on ${offer.signOnBonus || 0}, RSU ${offer.rsu || 0}
    
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

module.exports = {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  analyzeOfferLeverage
};
