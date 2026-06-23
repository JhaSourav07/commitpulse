import mongoose, { Document, Model, Schema } from 'mongoose';
import { NotificationFrequency } from '../types/index';

export interface INotification extends Document {
  username: string;
  email: string;
  managementTokenHash?: string;
  frequency: NotificationFrequency;
  notifyOnCommit: boolean;
  notifyOnStreak: boolean;
  notifyOnMilestone: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  managementTokenHash: {
    type: String,
    required: false,
    select: false,
  },
  frequency: {
    type: String,
    enum: ['realtime', 'daily', 'weekly'],
    default: 'daily',
  },
  notifyOnCommit: {
    type: Boolean,
    default: true,
  },
  notifyOnStreak: {
    type: Boolean,
    default: true,
  },
  notifyOnMilestone: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
