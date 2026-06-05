/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RadarChart from './RadarChart';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.whileInView;
      delete props.viewport;
      delete props.transition;

      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      );
    },
    polygon: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;

      return (
        <polygon className={className} style={style} {...props}>
          {children}
        </polygon>
      );
    },
  },
}));

describe('RadarChart mock integrations', () => {
  const cachedData = [
    { name: 'TypeScript', percentage: 70, color: '#3178c6' },
    { name: 'Python', percentage: 30, color: '#3572A5' },
  ];

  const remoteData = [
    { name: 'JavaScript', percentage: 50, color: '#f1e05a' },
    { name: 'TypeScript', percentage: 50, color: '#3178c6' },
  ];

  it('renders successfully with stubbed cached data', () => {
    render(
      <RadarChart
        languagesA={cachedData}
        languagesB={cachedData}
        labelA="Cache A"
        labelB="Cache B"
      />
    );

    expect(screen.getByText('Cache A')).toBeDefined();
    expect(screen.getByText('Cache B')).toBeDefined();
  });

  it('renders successfully with simulated remote data', () => {
    render(
      <RadarChart
        languagesA={remoteData}
        languagesB={remoteData}
        labelA="Remote A"
        labelB="Remote B"
      />
    );

    expect(screen.getByText('Remote A')).toBeDefined();
    expect(screen.getByText('Remote B')).toBeDefined();
  });

  it('falls back safely when one dataset is empty', () => {
    render(
      <RadarChart languagesA={cachedData} languagesB={[]} labelA="Primary" labelB="Fallback" />
    );

    expect(screen.getByText('Primary')).toBeDefined();
    expect(screen.getByText('Fallback')).toBeDefined();
  });

  it('handles delayed or partial data using padding logic', () => {
    render(
      <RadarChart
        languagesA={[
          {
            name: 'TypeScript',
            percentage: 100,
            color: '#3178c6',
          },
        ]}
        languagesB={[]}
        labelA="Loaded"
        labelB="Pending"
      />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
  });

  it('renders consistently when cache and remote datasets differ', () => {
    render(
      <RadarChart languagesA={cachedData} languagesB={remoteData} labelA="Cache" labelB="Remote" />
    );

    expect(screen.getByText('Cache')).toBeDefined();
    expect(screen.getByText('Remote')).toBeDefined();

    expect(screen.getAllByText('TypeScript')).toBeDefined();
  });
});
