import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  createdAt: Date;
  lastSeen?: Date;
  visitCount: number;
}

const UserSchema: Schema<IUser> = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
  },
  visitCount: {
    type: Number,
    default: 0,
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
