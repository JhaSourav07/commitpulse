export interface ParsedResume {
  name: string;
  email: string;
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
