const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    try {
      // First try to connect to the provided URI (e.g., local mongodb or Atlas)
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
      console.log('Failed to connect to primary MongoDB. Starting in-memory fallback for preview...');
      // Fallback to in-memory server
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
