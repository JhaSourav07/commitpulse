/**
 * MongoDB Schema & Models for Stack Analytics Caching
 *
 * Stores cached technology stack analytics to reduce repeated API computation
 * and enable historical trend analysis.
 */

import mongoose from 'mongoose';
import type { StackAnalytics, TechStackStat } from '@/types';

// Tech Stack Stat subdocument schema
const techStackStatSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      index: true,
    },
    color: {
      type: String,
      required: true,
    },
    contributionCount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    dominanceRank: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

// Main Stack Analytics Document schema
const stackAnalyticsSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    totalContributions: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    dominantStack: {
      type: String,
      required: true,
    },
    dominantStackColor: {
      type: String,
      required: true,
      match: /^#[0-9a-f]{6}$/i,
    },
    topStacks: {
      type: [techStackStatSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length > 0 && v.length <= 10,
        message: 'topStacks must contain 1-10 technology stats',
      },
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days TTL
      index: true,
      expires: 86400, // MongoDB TTL index: auto-delete after 24h of inactivity
    },
  },
  {
    timestamps: true,
  }
);

/**
 * MongoDB model for stack analytics caching.
 * Automatically expires documents 7 days after creation.
 */
export const StackAnalyticsModel =
  mongoose.models.StackAnalytics ||
  mongoose.model<StackAnalytics & { _id: mongoose.Types.ObjectId }>(
    'StackAnalytics',
    stackAnalyticsSchema
  );

/**
 * Caches stack analytics for a user in MongoDB
 */
export async function cacheStackAnalytics(
  username: string,
  analytics: StackAnalytics
): Promise<void> {
  try {
    const model = StackAnalyticsModel;

    // Convert Map to array for storage
    const topStacksArray = Array.from(analytics.stackBreakdown.values()).slice(0, 10);

    await model.updateOne(
      { username: username.toLowerCase() },
      {
        username: username.toLowerCase(),
        totalContributions: analytics.totalContributions,
        dominantStack: analytics.dominantStack,
        dominantStackColor: analytics.dominantStackColor,
        topStacks: topStacksArray,
        lastUpdated: new Date(analytics.lastUpdated),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { upsert: true }
    );
  } catch (error) {
    // Log but don't throw - caching is optional and shouldn't break the request
    console.error(`Failed to cache stack analytics for ${username}:`, error);
  }
}

/**
 * Retrieves cached stack analytics for a user from MongoDB
 */
export async function getCachedStackAnalytics(username: string): Promise<StackAnalytics | null> {
  try {
    const model = StackAnalyticsModel;
    const cached = await model.findOne({
      username: username.toLowerCase(),
    });

    if (!cached) return null;

    // Check if cache is stale (older than 1 hour)
    const now = Date.now();
    const lastUpdated = new Date(cached.lastUpdated).getTime();
    const ONE_HOUR_MS = 60 * 60 * 1000;

    if (now - lastUpdated > ONE_HOUR_MS) {
      return null; // Cache is stale, trigger refresh
    }

    // Reconstruct StackAnalytics from MongoDB document
    const stackBreakdown = new Map<string, TechStackStat>();
    for (const stat of cached.topStacks) {
      stackBreakdown.set(stat.language, stat);
    }

    return {
      totalContributions: cached.totalContributions,
      dominantStack: cached.dominantStack,
      dominantStackColor: cached.dominantStackColor,
      topStacks: cached.topStacks,
      stackBreakdown,
      lastUpdated: cached.lastUpdated.toISOString(),
    };
  } catch (error) {
    // Log but don't throw - caching is optional
    console.error(`Failed to retrieve cached stack analytics for ${username}:`, error);
    return null;
  }
}

/**
 * Clears cached stack analytics for a user
 */
export async function clearStackAnalyticsCache(username: string): Promise<void> {
  try {
    const model = StackAnalyticsModel;
    await model.deleteOne({ username: username.toLowerCase() });
  } catch (error) {
    console.error(`Failed to clear stack analytics cache for ${username}:`, error);
  }
}
