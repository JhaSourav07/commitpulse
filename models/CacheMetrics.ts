import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICacheMetrics extends Document {
  username: string;
  requestCount: number;
  lastRequest: Date;
  cacheHits: number;
  cacheMisses: number;
  averageLatency: number;
}

const CacheMetricsSchema: Schema<ICacheMetrics> = new Schema<ICacheMetrics>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    requestCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastRequest: {
      type: Date,
      default: Date.now,
    },
    cacheHits: {
      type: Number,
      default: 0,
      min: 0,
    },
    cacheMisses: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageLatency: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const CacheMetrics: Model<ICacheMetrics> =
  mongoose.models.CacheMetrics ||
  mongoose.model<ICacheMetrics>('CacheMetrics', CacheMetricsSchema, 'cacheMetrics');
