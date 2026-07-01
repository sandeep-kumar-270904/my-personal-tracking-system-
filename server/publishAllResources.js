const mongoose = require('mongoose');
require('dotenv').config();
const Resource = require('./models/Resource');
const connectDB = require('./config/db');

const migrate = async () => {
  try {
    await connectDB();
    const result = await Resource.updateMany({}, { $set: { isPublished: true } });
    console.log(`Updated ${result.modifiedCount} resources to isPublished = true`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrate();
