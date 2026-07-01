const User = require('../models/User');
const DSA = require('../models/DSA');
const CampusDrive = require('../models/CampusDrive');
const Network = require('../models/Network');

const calculateFitScore = async (application) => {
  let score = 0;
  const breakdown = {};

  try {
    const user = await User.findById(application.userId);
    if (!user) return { score, breakdown };

    // 1. Target Companies (20 points)
    const isTarget = user.targetCompanies?.some(c => c.toLowerCase() === application.company.toLowerCase());
    if (isTarget) {
      score += 20;
      breakdown.targetCompany = { score: 20, max: 20, text: 'Company is in your target list.' };
    } else {
      breakdown.targetCompany = { score: 0, max: 20, text: 'Company not in your target list.' };
    }

    // 2. Branch & Skills Match (25 points)
    // Simplified: Check if user's branch or DSA topics vaguely match the role
    let skillScore = 0;
    const roleLower = application.role.toLowerCase();
    
    if (user.branch && roleLower.includes(user.branch.toLowerCase())) {
       skillScore += 10;
    }
    
    const dsaRecords = await DSA.find({ userId: user._id }).distinct('topic');
    const matchedTopics = dsaRecords.filter(topic => roleLower.includes(topic.toLowerCase()));
    if (matchedTopics.length > 0) {
       skillScore += 15;
    } else if (dsaRecords.length > 20) {
       // if they have done a lot of DSA, give some baseline points
       skillScore += 10;
    }
    score += skillScore;
    breakdown.skillsMatch = { score: skillScore, max: 25, text: `Based on your branch and ${dsaRecords.length} DSA topics.` };

    // 3. Campus Visit (15 points)
    const campusDrive = await CampusDrive.findOne({ companyName: { $regex: new RegExp(`^${application.company}$`, 'i') } });
    if (campusDrive) {
      score += 15;
      breakdown.campusDrive = { score: 15, max: 15, text: 'Company has a campus drive.' };
    } else {
      breakdown.campusDrive = { score: 0, max: 15, text: 'No recorded campus drive for this company.' };
    }

    // 4. Networking Contact (20 points)
    const contact = await Network.findOne({ userId: user._id, company: { $regex: new RegExp(`^${application.company}$`, 'i') } });
    if (contact) {
      score += 20;
      breakdown.networking = { score: 20, max: 20, text: 'You have a networking contact here.' };
    } else {
      breakdown.networking = { score: 0, max: 20, text: 'No networking contacts found at this company.' };
    }

    // 5. Resume Match (10 points)
    if (application.resumeId) {
      score += 10;
      breakdown.resumeMatch = { score: 10, max: 10, text: 'You applied with a specific resume.' };
    } else {
      breakdown.resumeMatch = { score: 0, max: 10, text: 'No specific resume linked.' };
    }

    // 6. Timing (10 points)
    // We assume if it's applied within the last 3 days it's "early"
    const daysSinceApplied = Math.floor((new Date() - new Date(application.dateApplied)) / (1000 * 60 * 60 * 24));
    if (daysSinceApplied <= 3) {
      score += 10;
      breakdown.timing = { score: 10, max: 10, text: 'Applied early.' };
    } else {
      breakdown.timing = { score: 0, max: 10, text: 'Not applied early.' };
    }

    return { score, breakdown };
  } catch (error) {
    console.error('Error calculating fit score:', error);
    return { score: 0, breakdown: { error: 'Failed to calculate' } };
  }
};

module.exports = {
  calculateFitScore
};
