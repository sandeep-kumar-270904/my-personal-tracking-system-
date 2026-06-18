const fs = require('fs');
const path = require('path');

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
