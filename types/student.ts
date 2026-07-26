import { AcademicDomain } from '@/lib/educational/syllabus-mapper';

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface StudentProfile {
  githubUsername: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  careerInterests?: string[];
  graduationYear?: number;
  education: Education[];
  experience: Experience[];
  resumeUrl?: string;
  resumeFileName?: string;
  createdAt: Date;
  updatedAt: Date;
  learningCurve?: LearningCurveData;
  activeStudyStreak?: StudyStreak;
}

export interface ResumeUploadResponse {
  success: boolean;
  data?: ParsedResume;
  fileName?: string;
  error?: string;
}

export interface ResumeConfirmResponse {
  success: boolean;
  error?: string;
}

export interface DomainStats {
  domain: AcademicDomain;
  commitCount: number;
  linesAdded: number;
  linesDeleted: number;
  primaryLanguagesUsed: string[];
}

export interface LearningCurveDataPoint {
  date: string; // ISO string format (e.g., '2026-04-15')
  domains: Partial<Record<AcademicDomain, DomainStats>>;
  totalDailyCommits: number;
}

export interface LearningCurveData {
  timeline: LearningCurveDataPoint[]; // Rolling 30-day array
  primaryDomain: AcademicDomain;
  totalStudyDays: number;
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  startDate: string;
  endDate: string;
  activeDomains: AcademicDomain[];
  isActive: boolean;
}
