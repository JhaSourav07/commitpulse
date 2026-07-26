import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ActivityLandscape from './ActivityLandscape';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.activity.title': 'Activity Landscape',

        'dashboard.activity.commits_desc': 'Commit frequency over time',

        'dashboard.activity.commits': 'Commits',

        'dashboard.activity.loc': 'LoC',

        'dashboard.heatmap.tooltip_plural': 'contributions',

        'dashboard.activity.aria_range': 'from Jan 1 to Jan 7',
      };

      return translations[key] || key;
    },
  }),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');

  return {
    ...actual,
    motion: {
      ...actual.motion,

      div: ({ children, ...props }: React.ComponentProps<'div'>) => (
        <div {...props}>{children}</div>
      ),
    },
  };
});

const mockData = Array.from({ length: 100 }, (_, i) => ({
  date: `2024-01-${String(i + 1).padStart(2, '0')}`,
  count: i + 1,
  intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
}));

it('renders Activity Landscape heading', () => {
  render(<ActivityLandscape data={mockData} />);

  expect(screen.getByText('Activity Landscape')).toBeTruthy();
});

it('renders all tab buttons', () => {
  render(<ActivityLandscape data={mockData} />);

  expect(screen.getByText('1W')).toBeTruthy();
  expect(screen.getByText('1M')).toBeTruthy();
  expect(screen.getByText('3M')).toBeTruthy();
  expect(screen.getByText('1Y')).toBeTruthy();
});

it('shows pointer cursor styling on timeframe tabs', () => {
  render(<ActivityLandscape data={mockData} />);

  const tabLabels = ['1W', '1M', '3M', '1Y'];

  tabLabels.forEach((label) => {
    const tabButton = screen.getByText(label);

    expect(tabButton.classList.contains('cursor-pointer')).toBe(true);
  });
});

it('has 3M active by default', () => {
  render(<ActivityLandscape data={mockData} />);

  const tab = screen.getByText('3M');

  expect(tab.classList.contains('bg-black')).toBe(true);
});

it('activates 1W tab when clicked', () => {
  render(<ActivityLandscape data={mockData} />);

  const tab = screen.getByText('1W');

  fireEvent.click(tab);

  expect(tab.classList.contains('bg-black')).toBe(true);
});

it('renders activity chart', () => {
  render(<ActivityLandscape data={mockData} />);

  expect(screen.getByText('Activity Landscape')).toBeTruthy();

  expect(screen.getByText('Commit frequency over time')).toBeTruthy();
});

it('renders with empty data without crashing', () => {
  render(<ActivityLandscape data={[]} />);

  expect(screen.getByText('Activity Landscape')).toBeTruthy();
});
