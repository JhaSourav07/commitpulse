import { describe, expect, it } from 'vitest';
import type {
  Education,
  Experience,
  ParsedResume,
  ResumeConfirmResponse,
  ResumeUploadResponse,
  StudentProfile,
} from './student';

const education: Education = {
  institution: 'GLA University',
  degree: 'B.Tech',
  field: 'Computer Science',
  startDate: '2022-08-01',
  endDate: '2026-05-31',
};

const experience: Experience = {
  company: 'Akoode',
  role: 'SWE Intern',
  startDate: '2025-06-01',
  endDate: '2025-08-31',
  description: 'Worked on frontend and API integration.',
};

describe('types/student', () => {
  it('accepts valid ParsedResume shape', () => {
    const parsedResume: ParsedResume = {
      name: 'Sonal Mittal',
      email: 'sonal@example.com',
      skills: ['TypeScript', 'React'],
      education: [education],
      experience: [experience],
    };

    expect(parsedResume.skills).toContain('TypeScript');
  });

  it('accepts StudentProfile with optional fields omitted', () => {
    const profile: StudentProfile = {
      githubUsername: 'mittalsonal',
      name: 'Sonal Mittal',
      email: 'sonal@example.com',
      skills: ['Node.js'],
      education: [education],
      experience: [experience],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(profile.phone).toBeUndefined();
    expect(profile.resumeUrl).toBeUndefined();
  });

  it('accepts StudentProfile with all optional fields present', () => {
    const profile: StudentProfile = {
      githubUsername: 'mittalsonal',
      name: 'Sonal Mittal',
      email: 'sonal@example.com',
      phone: '+91-9000000000',
      skills: ['Next.js'],
      education: [education],
      experience: [experience],
      resumeUrl: 'https://example.com/resume.pdf',
      resumeFileName: 'resume.pdf',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    expect(profile.resumeFileName).toBe('resume.pdf');
  });

  it('preserves ResumeUploadResponse success and error unions', () => {
    const okResponse: ResumeUploadResponse = {
      success: true,
      data: {
        name: 'Sonal Mittal',
        email: 'sonal@example.com',
        skills: ['React'],
        education: [education],
        experience: [experience],
      },
      fileName: 'resume.pdf',
    };

    const errorResponse: ResumeUploadResponse = {
      success: false,
      error: 'Upload failed',
    };

    expect(okResponse.success).toBe(true);
    expect(errorResponse.error).toBe('Upload failed');
  });

  it('accepts ResumeConfirmResponse success and failure payloads', () => {
    const successPayload: ResumeConfirmResponse = { success: true };
    const failurePayload: ResumeConfirmResponse = {
      success: false,
      error: 'Confirmation failed',
    };

    expect(successPayload.success).toBe(true);
    expect(failurePayload.error).toBe('Confirmation failed');
  });
});
