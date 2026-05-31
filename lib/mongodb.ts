import mongoose from 'mongoose';

declare global {
  // Cached across hot reloads and repeated serverless invocations in the same process.
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
/**
 * Connects to the MongoDB database and returns the cached connection.
 *
 * Reuses an existing connection if one is already established.
 * Automatically resets the cache if the connection drops.
 *
 * @throws {Error} If called from the Edge runtime.
 * @throws {Error} If `MONGODB_URI` environment variable is not defined.
 * @returns The active Mongoose connection instance.
 *
 * @example
 * const db = await dbConnect();
 */
async function dbConnect() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('MongoDB is not supported in the Edge runtime. Use the Node.js runtime.');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
/**
 * Disconnects from the MongoDB database and clears the cached connection.
 *
 * Useful for graceful shutdown in tests or serverless teardown.
 *
 * @example
 * await dbDisconnect();
 */
export async function dbDisconnect(): Promise<void> {
  if (!cached.conn) return;

  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
}

export default dbConnect;
