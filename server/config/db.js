const mongoose = require('mongoose');

mongoose.connection.on('error', (err) => {
  console.warn(`MongoDB runtime connection event warning: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('MongoDB connection lost. Awaiting automatic reconnection...');
  }
});

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
    // In production, we MUST exit if we cannot connect to the database
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn("⚠️ Running in development mode without active MongoDB Atlas connection.");
      console.warn("👉 To connect: Go to MongoDB Atlas -> Network Access -> Add IP Address (0.0.0.0/0 or Current IP).");
    }
  }
};

module.exports = connectDB;
