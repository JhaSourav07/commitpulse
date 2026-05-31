import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IJob extends Document {
  company: string;
  role: string;
  description: string;
  location?: string;
  createdAt: Date;
}

const JobSchema: Schema = new Schema({
  company: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
