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

    // Check that top languages are rendered as axes
    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();
  });

  it('handles empty input arrays cleanly using pad languages', () => {
    render(<RadarChart languagesA={[]} languagesB={[]} labelA="User A" labelB="User B" />);

    // Padding should supply common ones
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
});
