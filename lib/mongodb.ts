import mongoose from 'mongoose';

declare global {
  // Cached across hot reloads and repeated serverless invocations in the same process.
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
    unavailable?: boolean; // Flag to track if MongoDB is intentionally disabled
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Checks if MongoDB is available (i.e., MONGODB_URI is configured).
 *
 * @returns true if MONGODB_URI is set and non-empty
 *
 * @example
 * if (isMongoDBAvailable()) {
 *   await dbConnect();
 * } else {
 *   console.log('MongoDB is not configured - user tracking disabled');
 * }
 */
export function isMongoDBAvailable(): boolean {
  const MONGODB_URI = process.env.MONGODB_URI;
  return Boolean(MONGODB_URI && MONGODB_URI.trim() !== '');
}

/**
 * Connects to the MongoDB database and returns the cached connection.
 *
 * Reuses an existing connection if one is already established.
 * Automatically resets the cache if the connection drops.
 *
 * ⚠️  **MONGODB_URI is OPTIONAL** — If not configured, this function will throw.
 * Use `isMongoDBAvailable()` to check before calling.
 *
 * @throws {Error} If called from the Edge runtime.
 * @throws {Error} If `MONGODB_URI` environment variable is not defined.
 * @returns The active Mongoose connection instance.
 *
 * @example
 * // Recommended: Check availability first
 * if (isMongoDBAvailable()) {
 *   const db = await dbConnect();
 * }
 *
 * @example
 * // Or use try-catch for graceful degradation
 * try {
 *   const db = await dbConnect();
 * } catch (error) {
 *   console.warn('MongoDB unavailable, skipping user tracking');
 * }
 */
async function dbConnect() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('MongoDB is not supported in the Edge runtime. Use the Node.js runtime.');
  }

  // Check if MongoDB was already determined to be unavailable
  if (cached.unavailable) {
    throw new Error(
      'MongoDB is not available. MONGODB_URI is not configured in environment variables. ' +
        'User tracking features will be disabled. See .env.local.example for setup instructions.'
    );
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

    if (!MONGODB_URI || MONGODB_URI.trim() === '') {
      // Mark as unavailable to avoid repeated checks
      cached.unavailable = true;
      
      throw new Error(
        'MongoDB is not configured. Please define the MONGODB_URI environment variable in .env.local. ' +
          'See .env.local.example for setup instructions. ' +
          'Note: MONGODB_URI is optional - user tracking features will be disabled without it.'
      );
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', e);
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
  cached.unavailable = false; // Reset unavailable flag
}

export default dbConnect;
export { dbConnect };
