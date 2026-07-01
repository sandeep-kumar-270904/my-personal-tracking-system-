const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let dummyUser = await User.findOne({ email: 'preview@test.com' });
    if (!dummyUser) {
      dummyUser = await User.create({
        name: 'Preview User',
        email: 'preview@test.com',
        password: 'password123',
        gradYear: '2026'
      });
    }
    req.user = dummyUser;
    next();
  } catch (error) {
    console.error("Auth Bypass Error:", error);
    res.status(500).json({ message: 'Server error in auth bypass' });
  }
};

module.exports = { protect };
