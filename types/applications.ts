export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'rejected'
  | 'selected'
  | 'withdrawn';

export interface JobData {
  _id: string;
  company: string;
  role: string;
  description: string;
  location?: string;
  createdAt: string;
}

export interface ApplicationData {
  _id: string;
  studentUsername: string;
  jobId: JobData;
  status: ApplicationStatus;
  interviewDate?: string;
  companyFeedback?: string;
  createdAt: string;
  updatedAt: string;
}
