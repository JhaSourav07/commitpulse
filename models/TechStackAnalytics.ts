// models/TechStackAnalytics.ts
// MongoDB/Mongoose schema for caching processed tech stack analytics.
// Reduces repeated GitHub API calls and computation costs.
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITechStackEntry {
  language: string;
  commits: number;
  percentage: number;
  color: string;
}

export interface ITechStackAnalytics extends Document {
  /** GitHub username (lowercased) */
  username: string;
  /** Year the analytics cover, e.g. "2024". "all" for full-history. */
  year: string;
  /** Top languages sorted by contribution count (desc) */
  techStack: ITechStackEntry[];
  /** Full language list (not just top-5) */
  allLanguages: ITechStackEntry[];
  /** Dominant language name */
  dominantLanguage: string | null;
  /** Developer archetype label */
  archetype: string;
  /** Total commits counted when the analytics were computed */
  totalCommits: number;
  /** ISO timestamp when the analytics were computed */
  computedAt: Date;
  /** When this cache entry expires — used for TTL index */
  ttlExpiry: Date;
}

const TechStackEntrySchema = new Schema<ITechStackEntry>(
  {
    language: { type: String, required: true },
    commits: { type: Number, required: true },
    percentage: { type: Number, required: true },
    color: { type: String, required: true },
  },
  { _id: false }
);

const TechStackAnalyticsSchema = new Schema<ITechStackAnalytics>(
  {
    username: { type: String, required: true, lowercase: true, trim: true },
    year: { type: String, required: true },
    techStack: { type: [TechStackEntrySchema], default: [] },
    allLanguages: { type: [TechStackEntrySchema], default: [] },
    dominantLanguage: { type: String, default: null },
    archetype: { type: String, required: true, default: 'GitHub Developer' },
    totalCommits: { type: Number, required: true, default: 0 },
    computedAt: { type: Date, required: true, default: Date.now },
    ttlExpiry: { type: Date, required: true },
  },
  {
    timestamps: false,
    collection: 'techstack_analytics',
  }
);

// Unique compound index: one document per (username, year) pair
TechStackAnalyticsSchema.index({ username: 1, year: 1 }, { unique: true });

// MongoDB TTL index: automatically delete expired documents
TechStackAnalyticsSchema.index({ ttlExpiry: 1 }, { expireAfterSeconds: 0 });

/** 24-hour cache TTL in milliseconds */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Build the TTL expiry date for a new cache entry.
 * @param ttlMs - Time-to-live in milliseconds (defaults to CACHE_TTL_MS = 24h)
 */
export function buildTtlExpiry(ttlMs: number = CACHE_TTL_MS): Date {
  return new Date(Date.now() + ttlMs);
}

const TechStackAnalytics: Model<ITechStackAnalytics> =
  mongoose.models.TechStackAnalytics ||
  mongoose.model<ITechStackAnalytics>('TechStackAnalytics', TechStackAnalyticsSchema);

export default TechStackAnalytics;
