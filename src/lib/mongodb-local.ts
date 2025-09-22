import mongoose from 'mongoose';

const MONGODB_URI = "mongodb://127.0.0.1:27017/school-bills";

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    if (global.mongoose.conn) {
      return global.mongoose.conn;
    }

    if (!global.mongoose.promise) {
      const opts = {
        bufferCommands: false,
      };

      global.mongoose.promise = mongoose.connect(MONGODB_URI, opts);
    }

    global.mongoose.conn = await global.mongoose.promise;
    return global.mongoose.conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export default connectDB;