/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ValueImpactDashboard from './ValueImpactDashboard';

vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;
      return <section className={className} {...props}>{children}</section>;
    },
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;
      return <div className={className} {...props}>{children}</div>;
    },
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'impact_dashboard.title': 'Real-World Impact Dashboard',
        'impact_dashboard.subtitle': 'Translating commit frequency into tangible engineering value',
        'impact_dashboard.score_title': 'Impact Score',
        'impact_dashboard.hours_title': 'Engineering Hours Saved',
        'impact_dashboard.hours_unit': 'hrs',
        'impact_dashboard.value_est': 'Est. Value',
        'impact_dashboard.depth_title': 'Problem-Solving Depth',
        'impact_dashboard.arch_title': 'Architectural Impact',
        'impact_dashboard.recruiter_pitch_title': 'Executive Recruiter Summary',
        'impact_dashboard.copy_summary': 'Copy Pitch',
        'impact_dashboard.copied': 'Copied!',
        'reporeel.launch_button': 'Launch RepoReel Studio',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('ValueImpactDashboard Component', () => {
  it('renders region role and main title header properly', () => {
    render(<ValueImpactDashboard repositories={[]} />);
    const regions = screen.getAllByRole('region');
    expect(regions.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Real-World Impact Dashboard')).toBeDefined();
  });

  it('renders metrics cards with calculated values', () => {
    const repos = [
      {
        name: 'sample-project',
        commits: 40,
        stars: 12,
        forks: 4,
        pullRequestCount: 6,
        primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      },
    ];

    render(<ValueImpactDashboard repositories={repos} />);
    expect(screen.getByText('Impact Score')).toBeDefined();
    expect(screen.getByText('Engineering Hours Saved')).toBeDefined();
    expect(screen.getByText('Problem-Solving Depth')).toBeDefined();
    expect(screen.getByText('Executive Recruiter Summary')).toBeDefined();
  });

  it('triggers onOpenRepoReel callback when launch button is clicked', () => {
    const handleOpenRepoReel = vi.fn();
    render(<ValueImpactDashboard repositories={[]} onOpenRepoReel={handleOpenRepoReel} />);

    const launchBtn = screen.getByText('Launch RepoReel Studio');
    expect(launchBtn).toBeDefined();
    fireEvent.click(launchBtn);
    expect(handleOpenRepoReel).toHaveBeenCalledTimes(1);
  });

  it('copies executive summary pitch to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ValueImpactDashboard repositories={[]} />);
    const copyBtn = screen.getByText('Copy Pitch');
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalled();
  });
});
