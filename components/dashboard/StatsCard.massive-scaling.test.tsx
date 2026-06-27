import { render, screen } from '@testing-library/react';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import StatsCard from './StatsCard';

beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

describe('StatsCard massive scaling', () => {
  it('renders very large metric values without crashing', () => {
    render(
      <StatsCard
        title="Total Contributions"
        value="999999999"
        description="Massive contribution count"
        icon="Flame"
      />
    );

    expect(screen.getByText('Total Contributions')).toBeInTheDocument();
    expect(screen.getByText(/999,999,999|999999999/)).toBeInTheDocument();
  });

  it('handles extremely long title text with wrapping', () => {
    const longTitle =
      'Very Long Contributor Activity Metric Title That Should Wrap Correctly Without Breaking Layout';

    render(
      <StatsCard
        title={longTitle}
        value="120000"
        description="Testing long text wrapping"
        icon="Flame"
      />
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('handles extremely long description text safely', () => {
    const longDescription = 'Activity '.repeat(1000);

    render(
      <StatsCard title="Activity Logs" value="50000" description={longDescription} icon="Flame" />
    );

    expect(screen.getByText('Activity Logs')).toBeInTheDocument();
  });

  it('renders zero and boundary values correctly', () => {
    render(
      <StatsCard
        title="Empty Contributors"
        value="0"
        description="No contributor actions"
        icon="Flame"
      />
    );

    expect(screen.getByText('Empty Contributors')).toBeInTheDocument();
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('renders within acceptable performance limits', () => {
    const start = performance.now();

    render(
      <StatsCard
        title="Massive Dataset"
        value="1000000000"
        description={'Contributor activity '.repeat(500)}
        icon="Flame"
      />
    );

    const end = performance.now();

    expect(end - start).toBeLessThan(process.env.CI ? 2000 : 500);
    expect(screen.getByText('Massive Dataset')).toBeInTheDocument();
  });
});
