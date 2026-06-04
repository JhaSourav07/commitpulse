import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('./ResumeUpload', () => ({
  __esModule: true,
  default: function StubResumeUpload(props: {
    onParsed: (data: unknown, fileName: string) => void;
  }) {
    return (
      <button onClick={() => props.onParsed(window.__TEST_PARSED__, 'responsive.pdf')}>
        Trigger Parsed
      </button>
    );
  },
}));

import ResumeProfileSection from './ResumeProfileSection';

function generateResponsiveParsed() {
  return {
    name: 'Responsive User',
    email: 'responsive@example.com',
    phone: '555-123-4567',
    skills: ['Responsive', 'Accessibility', 'Mobile', 'Testing', 'Grid'],
    education: [
      {
        institution: 'Responsive University',
        degree: 'BSc Interaction Design',
        field: 'UI / UX',
        startDate: '2016',
        endDate: '2020',
      },
      {
        institution: 'Mobile Institute',
        degree: 'MSc Mobile Systems',
        field: 'Responsive Interfaces',
        startDate: '2020',
        endDate: '2022',
      },
      {
        institution: 'Design Academy',
        degree: 'Certificate',
        field: 'Visual Design',
        startDate: '2022',
        endDate: '2023',
      },
    ],
    experience: [
      {
        company: 'Viewport Labs',
        role: 'Mobile UI Engineer',
        startDate: '2022',
        endDate: '2024',
        description: 'Built mobile-first layouts across multiple breakpoints.',
      },
      {
        company: 'Breakpoint Co',
        role: 'Front-end Developer',
        startDate: '2020',
        endDate: '2022',
        description: 'Created responsive dashboards and fluid navigation components.',
      },
      {
        company: 'Grid Studios',
        role: 'Design Systems Engineer',
        startDate: '2018',
        endDate: '2020',
        description: 'Maintained adaptive grid configurations for small screens.',
      },
    ],
  } as const;
}

function setMobileViewport() {
  window.innerWidth = 375;
  window.dispatchEvent(new Event('resize'));
}

describe('ResumeProfileSection — Responsive Breakpoints', () => {
  beforeEach(() => {
    window.__TEST_PARSED__ = undefined;
    setMobileViewport();
  });

  it('renders mobile-first form grid classes for narrow viewports', async () => {
    window.__TEST_PARSED__ = generateResponsiveParsed();
    render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    const personalGrid = screen.getByText('Full Name').closest('.grid');
    expect(personalGrid).toBeTruthy();
    expect(personalGrid).toHaveClass('grid-cols-1');
    expect(personalGrid).toHaveClass('sm:grid-cols-2');
  });

  it('renders education and experience sections as single-column mobile grids', async () => {
    window.__TEST_PARSED__ = generateResponsiveParsed();
    render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    // Safe multi-element array selection using getAllBy*
    const educationGrid = screen.getAllByPlaceholderText('Institution')[0].closest('.grid');
    const experienceGrid = screen.getAllByPlaceholderText('Company')[0].closest('.grid');

    expect(educationGrid).toBeTruthy();
    expect(experienceGrid).toBeTruthy();
    expect(educationGrid).toHaveClass('grid-cols-1');
    expect(educationGrid).toHaveClass('sm:grid-cols-2');
    expect(experienceGrid).toHaveClass('grid-cols-1');
    expect(experienceGrid).toHaveClass('sm:grid-cols-2');
  });

  it('keeps navigation controls visible and usable on mobile breakpoints', async () => {
    window.__TEST_PARSED__ = generateResponsiveParsed();
    render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    const backButton = screen.getByRole('button', { name: 'Back' });
    const saveButton = screen.getByRole('button', { name: 'Save Profile' });

    expect(backButton).toBeVisible();
    expect(saveButton).toBeVisible();
    fireEvent.click(backButton);

    expect(await screen.findByText(/Upload your PDF or DOCX resume/i)).toBeTruthy();
  });

  it('uses full-width input styling to avoid fixed horizontal widths on mobile', async () => {
    window.__TEST_PARSED__ = generateResponsiveParsed();
    render(<ResumeProfileSection githubUsername="octocat" />);

    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    const fullNameInput = screen.getByDisplayValue('Responsive User');
    expect(fullNameInput).toHaveClass('w-full');

    const emailInput = screen.getByDisplayValue('responsive@example.com');
    expect(emailInput).toHaveClass('w-full');

    const skillTag = screen.getByDisplayValue('Responsive');
    expect(skillTag).toBeTruthy();
  });

  it('renders quickly under mobile viewport conditions', async () => {
    window.__TEST_PARSED__ = generateResponsiveParsed();
    const start = performance.now();

    render(<ResumeProfileSection githubUsername="octocat" />);
    fireEvent.click(await screen.findByText('Trigger Parsed'));
    await screen.findByText('Review Parsed Data');

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
    expect(screen.getByText('Review Parsed Data')).toBeTruthy();
  });
});
