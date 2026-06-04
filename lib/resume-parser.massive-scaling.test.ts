import { describe, it, expect } from 'vitest';
import { parseResume, MAX_FILE_SIZE } from './resume-parser';

describe('resume-parser-massive-scaling', () => {
  it('should parse 2,000 distinct skills efficiently without performance degradation', async () => {
    const skillsList = Array.from({ length: 2000 }, (_, i) => `SkillName${i}`);
    const text = `John Doe\nSkills\n${skillsList.join(', ')}`;
    const buffer = Buffer.from(text);

    const startTime = Date.now();
    const result = await parseResume(buffer, 'application/pdf');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(500); // completed within 500ms
    expect(result.skills.length).toBe(2000);
    expect(result.skills[0]).toBe('SkillName0');
    expect(result.skills[1999]).toBe('SkillName1999');
  });

  it('should handle a large number of education entries (500 entries) correctly', async () => {
    const educationLines: string[] = [];
    for (let i = 0; i < 500; i++) {
      educationLines.push(`University Number ${i} 2010 - 2014`);
    }
    const text = `John Doe\nEducation\n${educationLines.join('\n')}`;
    const buffer = Buffer.from(text);

    const startTime = Date.now();
    const result = await parseResume(buffer, 'application/pdf');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
    expect(result.education.length).toBe(500);
    expect(result.education[0].institution).toBe('University Number 0 2010 - 2014');
    expect(result.education[499].institution).toBe('University Number 499 2010 - 2014');
  });

  it('should handle a large number of experience entries (500 entries) correctly', async () => {
    const experienceLines: string[] = [];
    for (let i = 0; i < 500; i++) {
      experienceLines.push(`Company Name ${i} 2015 to 2019`);
    }
    const text = `John Doe\nExperience\n${experienceLines.join('\n')}`;
    const buffer = Buffer.from(text);

    const startTime = Date.now();
    const result = await parseResume(buffer, 'application/pdf');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
    expect(result.experience.length).toBe(500);
    expect(result.experience[0].company).toBe('Company Name 0 2015 to 2019');
    expect(result.experience[499].company).toBe('Company Name 499 2015 to 2019');
  });

  it('should process a file matching exactly the maximum allowed file size boundary (5MB) without crashing', async () => {
    // Generate a 5MB string with a valid name, email and some text
    const header = 'John Doe\njohn.doe@example.com\n';
    const fillSize = MAX_FILE_SIZE - Buffer.byteLength(header);
    const filler = 'A'.repeat(fillSize);
    const buffer = Buffer.from(header + filler);

    expect(buffer.byteLength).toBe(MAX_FILE_SIZE);

    const startTime = Date.now();
    const result = await parseResume(buffer, 'application/pdf');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000); // 5MB parsed in under 2 seconds
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
  });
});
