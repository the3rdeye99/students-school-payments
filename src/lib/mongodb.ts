import mongoose from 'mongoose';

// Define the shape of our cached mongoose global
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare the global mongoose cache
declare global {
  var mongoose: MongooseCache;
}

const MONGODB_URI = "mongodb+srv://kfc-school-bills:kayodefilani_123@cluster0.u3ihnqh.mongodb.net/school-bills?retryWrites=true&w=majority&appName=Cluster0";

// Initialize the global mongoose cache if it doesn't exist
if (!global.mongoose) {
  global.mongoose = {
    conn: null,
    promise: null
  };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  // If we have a connection, return it
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  // If we don't have a promise to connect, create one
  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: true,
    };

    global.mongoose.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    // Wait for the connection
    const connection = await global.mongoose.promise;
    global.mongoose.conn = connection;
    return connection;
  } catch (e) {
    // If there's an error, clear the promise and throw
    global.mongoose.promise = null;
    throw e;
  }
}

export default connectToDatabase;