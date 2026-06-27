/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RadarChart from './RadarChart';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    polygon: (props: any) => <polygon {...props} />,
  },
}));

describe('RadarChart timezone boundaries', () => {
  it('limits displayed axes to maximum 6 languages', () => {
    const languagesA = [
      { name: 'TS', percentage: 10, color: '#1' },
      { name: 'JS', percentage: 20, color: '#2' },
      { name: 'Python', percentage: 30, color: '#3' },
      { name: 'Go', percentage: 40, color: '#4' },
      { name: 'Rust', percentage: 50, color: '#5' },
      { name: 'Java', percentage: 60, color: '#6' },
      { name: 'Ruby', percentage: 70, color: '#7' },
    ];

    render(<RadarChart languagesA={languagesA} languagesB={[]} labelA="A" labelB="B" />);

    expect(screen.queryByText('Ruby')).toBeNull();
  });

  it('handles percentages greater than 100 safely', () => {
    render(
      <RadarChart
        languagesA={[{ name: 'TypeScript', percentage: 150, color: '#1' }]}
        languagesB={[]}
        labelA="A"
        labelB="B"
      />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
  });

  it('handles negative percentages safely', () => {
    render(
      <RadarChart
        languagesA={[{ name: 'TypeScript', percentage: -50, color: '#1' }]}
        languagesB={[]}
        labelA="A"
        labelB="B"
      />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
  });

  it('renders combined language list from both users', () => {
    render(
      <RadarChart
        languagesA={[{ name: 'TypeScript', percentage: 50, color: '#1' }]}
        languagesB={[{ name: 'Rust', percentage: 50, color: '#2' }]}
        labelA="A"
        labelB="B"
      />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('Rust')).toBeDefined();
  });

  it('renders percentage comparison section correctly', () => {
    render(
      <RadarChart
        languagesA={[{ name: 'TypeScript', percentage: 75, color: '#1' }]}
        languagesB={[{ name: 'TypeScript', percentage: 25, color: '#2' }]}
        labelA="A"
        labelB="B"
      />
    );

    expect(screen.getByText('75%')).toBeDefined();
    expect(screen.getByText('25%')).toBeDefined();
  });
});
