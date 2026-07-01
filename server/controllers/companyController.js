const Application = require('../models/Application');
const Interview = require('../models/Interview');

// @desc    Get aggregated company insights
// @route   GET /api/companies/insights
// @access  Private
const getCompanyInsights = async (req, res) => {
  try {
    // 1. Aggregate applications by company
    const appStats = await Application.aggregate([
      {
        $group: {
          _id: { $toLower: "$company" },
          originalName: { $first: "$company" },
          totalApplications: { $sum: 1 },
          shortlisted: {
            $sum: { $cond: [{ $in: ["$status", ["SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFER"]] }, 1, 0] }
          }
        }
      }
    ]);

    // 2. Aggregate interviews by company
    const interviewStats = await Interview.aggregate([
      {
        $group: {
          _id: { $toLower: "$company" },
          totalInterviews: { $sum: 1 },
          offers: {
            $sum: { $cond: [{ $or: [{ $eq: ["$outcome", "PASSED"] }, { $eq: ["$offerMade", true] }] }, 1, 0] }
          },
          avgQuestionsAsked: { $avg: { $size: { $ifNull: ["$questionsAsked", []] } } }
        }
      }
    ]);

    // 3. Merge data
    const insightsMap = new Map();

    appStats.forEach(app => {
      insightsMap.set(app._id, {
        name: app.originalName,
        totalApplications: app.totalApplications,
        shortlisted: app.shortlisted,
        totalInterviews: 0,
        offers: 0,
        avgQuestionsAsked: 0
      });
    });

    interviewStats.forEach(intv => {
      if (insightsMap.has(intv._id)) {
        const existing = insightsMap.get(intv._id);
        existing.totalInterviews = intv.totalInterviews;
        existing.offers = intv.offers;
        existing.avgQuestionsAsked = Math.round(intv.avgQuestionsAsked || 0);
      } else {
        // Just in case there's an interview without an application record
        insightsMap.set(intv._id, {
          name: intv._id.charAt(0).toUpperCase() + intv._id.slice(1),
          totalApplications: 0,
          shortlisted: 0,
          totalInterviews: intv.totalInterviews,
          offers: intv.offers,
          avgQuestionsAsked: Math.round(intv.avgQuestionsAsked || 0)
        });
      }
    });

    // 4. Format and calculate metrics
    const insightsArray = Array.from(insightsMap.values()).map(data => {
      const interviewRate = data.totalApplications > 0 
        ? ((data.shortlisted / data.totalApplications) * 100).toFixed(1) 
        : 0;
        
      const offerRate = data.totalInterviews > 0 
        ? ((data.offers / data.totalInterviews) * 100).toFixed(1) 
        : 0;

      return {
        ...data,
        interviewRate: parseFloat(interviewRate),
        offerRate: parseFloat(offerRate)
      };
    });

    // Sort by total applications descending
    insightsArray.sort((a, b) => b.totalApplications - a.totalApplications);

    res.status(200).json(insightsArray);
  } catch (error) {
    console.error("Company Insights Error:", error);
    res.status(500).json({ message: 'Failed to fetch company insights' });
  }
};

module.exports = {
  getCompanyInsights
};
