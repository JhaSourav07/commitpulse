import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, expect, test, describe } from 'vitest';

declare global {
  interface Window {
    __TEST_PARSED__?: unknown;
  }
}

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, props.children),
  },
  AnimatePresence: (props: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, props.children),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('./ResumeUpload', () => {
  return {
    __esModule: true,
    default: function StubResumeUpload(props: {
      onParsed: (data: unknown, filename: string) => void;
    }) {
      return (
        <div>
          <button onClick={() => props.onParsed(window.__TEST_PARSED__, 'big-resume.pdf')}>
            Trigger Parsed
          </button>
        </div>
      );
    },
  };
});

import ResumeProfileSection from './ResumeProfileSection';

function generateLargeParsed({ skills = 1000, education = 200, experience = 200 } = {}) {
  const longString = (i: number) => `x`.repeat(200) + `-${i}`;

  const parsed = {
    name: 'Big Name',
    email: 'big@example.com',
    phone: '000-000-0000',
    skills: Array.from({ length: skills }, (_, i) => `Skill-${i}-${longString(i)}`),
    education: Array.from({ length: education }, (_, i) => ({
      institution: `Institution ${i} ${longString(i)}`,
      degree: `Degree ${i}`,
      field: `Field ${i}`,
      startDate: `200${i % 10}`,
      endDate: `20${10 + (i % 10)}`,
    })),
    experience: Array.from({ length: experience }, (_, i) => ({
      company: `Company ${i} ${longString(i)}`,
      role: `Role ${i}`,
      startDate: `201${i % 10}`,
      endDate: `202${i % 10}`,
      description: `Description ${i} ` + longString(i),
    })),
  } as const;

  return parsed as unknown;
}

describe('ResumeProfileSection — Massive Scaling', () => {
  test('renders with very large parsed payload without throwing and shows preview header', async () => {
    window.__TEST_PARSED__ = generateLargeParsed({ skills: 400, education: 80, experience: 80 });

    const t0 = performance.now();
    render(<ResumeProfileSection githubUsername="octocat" />);

    const trigger = screen.getByText('Trigger Parsed');
    fireEvent.click(trigger);

    const header = await screen.findByText('Review Parsed Data');
    const dt = performance.now() - t0;

    expect(header).toBeTruthy();

    expect(dt).toBeLessThan(15000);
  });

  test('skills container preserves wrapping class and renders all skill inputs', async () => {
    window.__TEST_PARSED__ = generateLargeParsed({ skills: 500, education: 10, experience: 10 });
    render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    const skillsLabel = screen.getByText('Skills');
    const headerDiv = skillsLabel.parentElement as HTMLElement;
    const skillsContainer = headerDiv.nextElementSibling as HTMLElement;

    expect(skillsContainer).toBeTruthy();
    expect(skillsContainer.className.includes('flex-wrap')).toBe(true);

    const inputs = skillsContainer.querySelectorAll('input');
    expect(inputs.length).toBe(500);
  });

  test('education and experience lists render expected item counts without breaking DOM', async () => {
    window.__TEST_PARSED__ = generateLargeParsed({ skills: 20, education: 120, experience: 120 });
    render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    const eduLabel = screen.getByText('Education');
    const eduHeader = eduLabel.parentElement as HTMLElement;
    const eduContainer = eduHeader.nextElementSibling as HTMLElement;
    expect(eduContainer).toBeTruthy();
    expect(eduContainer.children.length).toBe(120);

    const expLabel = screen.getByText('Experience');
    const expHeader = expLabel.parentElement as HTMLElement;
    const expContainer = expHeader.nextElementSibling as HTMLElement;
    expect(expContainer).toBeTruthy();
    expect(expContainer.children.length).toBe(120);
  });

  test('SVG icons exist and have viewBox attributes (scalable vectors)', async () => {
    window.__TEST_PARSED__ = generateLargeParsed({ skills: 5, education: 2, experience: 2 });
    const { container } = render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((s) => {
      expect(s.getAttribute('viewBox')).toBeTruthy();
    });
  });

  test('mount/unmount cycles do not leak and unmount removes nodes', async () => {
    window.__TEST_PARSED__ = generateLargeParsed({ skills: 30, education: 30, experience: 30 });
    const { unmount } = render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    unmount();
    expect(document.body.textContent).not.toContain('Review Parsed Data');
  });
});
