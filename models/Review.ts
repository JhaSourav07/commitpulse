import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReview extends Document {
  name: string;
  handle: string;
  platform: 'twitter' | 'github';
  message: string;
  accentColor: string;
  approved: boolean;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  handle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  platform: {
    type: String,
    enum: ['twitter', 'github'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000,
  },
  accentColor: {
    type: String,
    required: true,
    match: /^#[0-9a-fA-F]{6}$/,
    default: '#10b981',
  },
  approved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
