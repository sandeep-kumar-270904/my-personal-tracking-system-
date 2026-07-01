const Application = require('../models/Application');
const Network = require('../models/Network');
const Resume = require('../models/Resume');
const DSA = require('../models/DSA');

// @desc    Global Search
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ applications: [], network: [], resumes: [], dsa: [] });
    }

    const regex = new RegExp(q, 'i');
    const userId = req.user._id;

    const [applications, network, resumes, dsa] = await Promise.all([
      Application.find({ 
        userId, 
        $or: [{ company: regex }, { role: regex }] 
      }).select('company role status').limit(5),
      
      Network.find({ 
        userId, 
        $or: [{ name: regex }, { company: regex }] 
      }).select('name company role status').limit(5),
      
      Resume.find({ 
        user: userId, 
        originalName: regex 
      }).select('originalName isPrimary').limit(5),
      
      DSA.find({ 
        user: userId, 
        $or: [{ problemName: regex }, { topic: regex }] 
      }).select('problemName topic difficulty').limit(5)
    ]);

    res.json({
      applications,
      network,
      resumes,
      dsa
    });
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

module.exports = {
  globalSearch
};
