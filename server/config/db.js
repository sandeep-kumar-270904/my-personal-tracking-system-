const mongoose = require('mongoose');

/**
 * Initializes the connection to the primary MongoDB database.
 * If the connection fails in production, the application will forcefully exit
 * to prevent data corruption or stateless zombie pods.
 * 
 * @async
 * @function connectDB
 * @throws {Error} If MONGODB_URI is undefined or connection is refused
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in the environment variables!");
    }

    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // In production, we MUST exit if we cannot connect to the database
    process.exit(1);
  }
};

module.exports = connectDB;
