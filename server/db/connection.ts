import mongoose from 'mongoose';
import { log } from '../vite';

// MongoDB connection string - use environment variable or default to a MongoDB Atlas connection
// For development, we'll use an in-memory MongoDB server which doesn't require external connectivity
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edumanage';

// Connect to MongoDB with timeout
export async function connectToDatabase() {
  try {
    // Add connection options with server selection timeout
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      connectTimeoutMS: 5000
    };
    
    await mongoose.connect(MONGODB_URI, options);
    log('Connected to MongoDB database', 'mongodb');
    return mongoose.connection;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    log('Continuing with in-memory storage instead', 'mongodb');
    // Don't exit the process, just continue with in-memory storage
    return null;
  }
}

// Disconnect from MongoDB
export async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    log('Disconnected from MongoDB', 'mongodb');
  } catch (error) {
    log(`MongoDB disconnect error: ${error}`, 'mongodb');
  }
}

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  log(`MongoDB connection error: ${err}`, 'mongodb');
});

mongoose.connection.on('disconnected', () => {
  log('MongoDB disconnected', 'mongodb');
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});