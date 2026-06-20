const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getDashboardStats, getDashboardUpcoming } = require('./controllers/dashboardController');
const User = require('./models/User');

dotenv.config();

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/placement_tracker_inmem_fallback');
    const user = await User.findOne();
    if (!user) {
      console.log("No user found.");
      process.exit(0);
    }
    
    console.log("Testing Stats with User:", user._id);
    const req = { user: { _id: user._id } };
    const res = {
      json: (data) => console.log("SUCCESS:", Object.keys(data)),
      status: (code) => ({ json: (data) => console.log(`FAILED ${code}:`, data) })
    };
    
    console.log("Testing stats...");
    await getDashboardStats(req, res);
    
    console.log("Testing upcoming...");
    await getDashboardUpcoming(req, res);

  } catch (err) {
    console.error("SCRIPT ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
