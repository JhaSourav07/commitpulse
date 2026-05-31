import mongoose, { Document, Model, Schema } from 'mongoose';

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'rejected'
  | 'selected'
  | 'withdrawn';

export interface IApplication extends Document {
  studentUsername: string;
  jobId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  interviewDate?: Date;
  companyFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
  {
    studentUsername: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview_scheduled', 'rejected', 'selected', 'withdrawn'],
      default: 'applied',
    },
    interviewDate: {
      type: Date,
    },
    companyFeedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
