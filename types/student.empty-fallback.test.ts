import { describe, expect, it } from 'vitest';
import type {
  ParsedResume,
  Education,
  Experience,
  StudentProfile,
  ResumeUploadResponse,
  ResumeConfirmResponse,
} from './student';

describe('types/student - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. constructs an empty resume with missing optional fields without runtime errors', () => {
    const emptyResume: ParsedResume = {
      name: '',
      email: '',
      phone: '',
      skills: [],
      education: [],
      experience: [],
    };
    expect(emptyResume.name).toBe('');
    expect(emptyResume.skills).toHaveLength(0);
    expect(emptyResume.education).toHaveLength(0);
    expect(JSON.stringify(emptyResume)).toContain('"skills":[]');
  });

  it('2. constructs education entries with empty institution and degree strings', () => {
    const emptyEdu: Education = {
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
    };
    expect(emptyEdu.institution).toBe('');
    expect(Object.values(emptyEdu).every((v) => v === '')).toBe(true);
  });

  it('3. constructs experience entries with empty or missing description', () => {
    const emptyExp: Experience = {
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    expect(emptyExp.description).toBe('');
    expect(Object.values(emptyExp).every((v) => v === '')).toBe(true);
  });

  it('4. constructs a student profile with only required fields and all optionals omitted', () => {
    const minimalProfile: StudentProfile = {
      githubUsername: '',
      name: '',
      email: '',
      skills: [],
      education: [],
      experience: [],
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    expect(minimalProfile.phone).toBeUndefined();
    expect(minimalProfile.careerInterests).toBeUndefined();
    expect(minimalProfile.graduationYear).toBeUndefined();
    expect(minimalProfile.resumeUrl).toBeUndefined();
    expect(minimalProfile.resumeFileName).toBeUndefined();
  });

  it('5. constructs upload and confirm responses in both success and error states', () => {
    const successUpload: ResumeUploadResponse = { success: true };
    expect(successUpload.data).toBeUndefined();
    expect(successUpload.fileName).toBeUndefined();

    const errorUpload: ResumeUploadResponse = { success: false, error: 'Upload failed' };
    expect(errorUpload.error).toBe('Upload failed');

    const successConfirm: ResumeConfirmResponse = { success: true };
    expect(successConfirm.error).toBeUndefined();

    const errorConfirm: ResumeConfirmResponse = { success: false, error: 'Confirmation failed' };
    expect(errorConfirm.error).toBe('Confirmation failed');
  });

  it('6. serializes and deserializes a full profile with empty arrays safely through JSON', () => {
    const profile: StudentProfile = {
      githubUsername: 'test-user',
      name: 'Test',
      email: 'test@example.com',
      skills: [],
      education: [],
      experience: [],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    };
    const json = JSON.stringify(profile);
    const parsed = JSON.parse(json) as StudentProfile;
    expect(parsed.githubUsername).toBe('test-user');
    expect(parsed.skills).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.experience).toEqual([]);
  });
});
