const mongoose = require('mongoose');
require('dotenv').config();
const Resource = require('./models/Resource');
const User = require('./models/User');
const ResourceReview = require('./models/ResourceReview');
const connectDB = require('./config/db');

const seed = async () => {
  try {
    await connectDB();
    const user = await User.findOne({});
    if (!user) {
      console.log('No user found, creating a dummy user for reviews');
      await User.create({ name: 'Alice Smith', email: 'alice@example.com', password: 'password123' });
    }
    const targetUser = await User.findOne({});

    const resources = await Resource.find({});
    if (resources.length === 0) {
      console.log('No resources found');
      process.exit(1);
    }

    await ResourceReview.deleteMany({});
    
    const reviews = [
      { resourceId: resources[0]._id, userId: targetUser._id, rating: 5, comment: 'Absolutely brilliant resource! Really helped me understand the core concepts clearly.' },
      { resourceId: resources[1]._id, userId: targetUser._id, rating: 4, comment: 'Great overview, though I wish there were more practical examples.' },
      { resourceId: resources[2]._id, userId: targetUser._id, rating: 5, comment: 'A must-read for anyone preparing for system design interviews.' },
    ];

    await ResourceReview.insertMany(reviews);
    console.log('Seeded reviews successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
