import mongoose from "mongoose";

// Define the shape of our cached mongoose global
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend global type to avoid redeclaration errors
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Load MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Please add your MongoDB URI to .env");
}

// Initialize the global mongoose cache if it doesn't exist
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (global.mongoose?.conn) {
    return global.mongoose.conn;
  }

  if (!global.mongoose?.promise) {
    const opts = { bufferCommands: true };
    if (!MONGODB_URI) {
      throw new Error("❌ Please add your MongoDB URI to .env");
    }
    global.mongoose!.promise = mongoose.connect(MONGODB_URI as string, opts);
  }

  try {
    global.mongoose!.conn = await global.mongoose!.promise;
    return global.mongoose!.conn;
  } catch (err) {
    global.mongoose!.promise = null;
    throw err;
  }
}

export default connectToDatabase;
