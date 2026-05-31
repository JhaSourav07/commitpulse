import mongoose, { Document, Model, Schema } from 'mongoose';

export type CompanyStatus = 'emailUnverified' | 'pending' | 'approved' | 'rejected';

export interface ICompany extends Document {
  companyName: string;
  email: string;
  password: string;
  otp: string | null;
  otpExpires: Date | null;
  emailVerified: boolean;
  status: CompanyStatus;
  createdAt: Date;
}

const CompanySchema: Schema = new Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['emailUnverified', 'pending', 'approved', 'rejected'],
    default: 'emailUnverified',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
