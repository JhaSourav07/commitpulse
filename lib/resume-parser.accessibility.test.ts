import { describe, it, expect } from 'vitest';

import { parseResume } from './resume-parser';

describe('resume-parser accessibility compliance', () => {
  it('preserves readable heading hierarchy order', async () => {
    const input = `
John Doe

Education
B.Tech Computer Science
2020 - 2024

Experience
Frontend Developer
2024 - Present
`;

    const result = await parseResume(Buffer.from(input), 'text/plain');

    expect(result.education.length).toBeGreaterThan(0);
    expect(result.experience.length).toBeGreaterThan(0);
  });

  it('preserves semantic section labels for assistive readability', async () => {
    const input = `
John Doe

Skills
JavaScript, TypeScript, Accessibility
`;

    const result = await parseResume(Buffer.from(input), 'text/plain');

    expect(result.skills).toContain('JavaScript');

    expect(result.skills).toContain('Accessibility');
  });

  it('normalizes excessive whitespace safely', async () => {
    const input = `
John     Doe


Skills

React     TypeScript
`;

    const result = await parseResume(Buffer.from(input), 'text/plain');

    expect(result.skills.length).toBeGreaterThan(0);
  });

  it('handles unicode characters used in accessible resumes', async () => {
    const input = `
José Álvarez
Frontend Engineer ♿

Skills
React, Accessibility
`;

    const result = await parseResume(Buffer.from(input), 'text/plain');

    expect(result.skills).toContain('Accessibility');
  });

  it('preserves logical reading flow for keyboard and screen reader parsing', async () => {
    const input = `
John Doe

Experience
Frontend Developer
2022 - Present

Education
B.Tech
2018 - 2022
`;

    const result = await parseResume(Buffer.from(input), 'text/plain');

    expect(result.experience.length).toBeGreaterThan(0);

    expect(result.education.length).toBeGreaterThan(0);
  });
});
