import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWatchlist extends Document {
  username: string;
  subscribedAt: Date;
}

const WatchlistSchema: Schema<IWatchlist> = new Schema<IWatchlist>({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Watchlist: Model<IWatchlist> =
  mongoose.models.Watchlist ||
  mongoose.model<IWatchlist>('Watchlist', WatchlistSchema, 'watchlist');
