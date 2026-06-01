import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface IExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface IStudentProfile extends Document {
  githubUsername: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  education: IEducation[];
  experience: IExperience[];
  resumeUrl?: string;
  resumeFileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EducationSchema: Schema = new Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
});

const ExperienceSchema: Schema = new Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  description: { type: String, default: '' },
});

const StudentProfileSchema: Schema = new Schema({
  githubUsername: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  skills: [{ type: String }],
  education: [EducationSchema],
  experience: [ExperienceSchema],
  resumeUrl: { type: String },
  resumeFileName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

StudentProfileSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export const StudentProfile: Model<IStudentProfile> =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
