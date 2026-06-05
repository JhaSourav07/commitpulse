import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StatsCard from './StatsCard';

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

const renderStatsCard = () =>
  render(
    <StatsCard
      title="Total Commits"
      value="120"
      description="Commits this month"
      icon="GitCommit"
      showUTCDisclaimer
      utcDate="2026-06-04"
      chartData={[20, 40, 60, 80]}
    />
  );

const setTheme = (theme: 'dark' | 'light') => {
  document.documentElement.className = theme === 'dark' ? 'dark' : '';
};

describe('StatsCard theme contrast', () => {
  afterEach(() => {
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('renders readable text in light theme', () => {
    setTheme('light');
    renderStatsCard();

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Commits this month')).toBeInTheDocument();
  });

  it('renders readable text in dark theme', () => {
    setTheme('dark');
    renderStatsCard();

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Commits this month')).toBeInTheDocument();
  });

  it('contains light and dark theme contrast classes', () => {
    const { container } = renderStatsCard();

    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('dark:bg-[#0a0a0a]');
    expect(card.className).toContain('border-black/10');
    expect(card.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('applies proper text contrast classes', () => {
    renderStatsCard();

    expect(screen.getByText('120').className).toContain('text-gray-900');
    expect(screen.getByText('120').className).toContain('dark:text-white');
    expect(screen.getByText('Total Commits').className).toContain('text-[#A1A1AA]');
    expect(screen.getByText('Commits this month').className).toContain('text-[#A1A1AA]');
  });

  it('keeps foreground content inside overflow-hidden card', () => {
    const { container } = renderStatsCard();

    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain('overflow-hidden');
    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('UTC Date: 2026-06-04')).toBeInTheDocument();
  });
});
