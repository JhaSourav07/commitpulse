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

describe('RadarChart', () => {
  const mockLangsA = [
    { name: 'TypeScript', percentage: 70, color: '#3178c6' },
    { name: 'Python', percentage: 30, color: '#3572A5' },
  ];

  const mockLangsB = [
    { name: 'TypeScript', percentage: 50, color: '#3178c6' },
    { name: 'JavaScript', percentage: 50, color: '#f1e05a' },
  ];

  it('renders title, labels, and language axis names', () => {
    render(
      <RadarChart languagesA={mockLangsA} languagesB={mockLangsB} labelA="User A" labelB="User B" />
    );

    expect(screen.getByText('Language Dominance')).toBeDefined();
    expect(screen.getByText('User A')).toBeDefined();
    expect(screen.getByText('User B')).toBeDefined();

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();
  });

  it('handles empty input arrays cleanly using pad languages', () => {
    render(<RadarChart languagesA={[]} languagesB={[]} labelA="User A" labelB="User B" />);

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
  });

  it('verify at least 3 axes are always shown via padding when fewer are provided', () => {
    const singleLang = [{ name: 'TypeScript', percentage: 100, color: '#3178c6' }];

    render(
      <RadarChart languagesA={singleLang} languagesB={singleLang} labelA="User A" labelB="User B" />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
  });

  it('scales axis points dynamically based on max score in data', () => {
    const highScoreLangs = [
      { name: 'TypeScript', percentage: 100, color: '#3178c6' },
      { name: 'Python', percentage: 80, color: '#3572A5' },
      { name: 'JavaScript', percentage: 60, color: '#f1e05a' },
    ];

    const lowScoreLangs = [
      { name: 'TypeScript', percentage: 10, color: '#3178c6' },
      { name: 'Python', percentage: 5, color: '#3572A5' },
      { name: 'JavaScript', percentage: 2, color: '#f1e05a' },
    ];

    const { container } = render(
      <RadarChart
        languagesA={highScoreLangs}
        languagesB={lowScoreLangs}
        labelA="High Scorer"
        labelB="Low Scorer"
      />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();

    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText('10%')).toBeDefined();

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });
});
