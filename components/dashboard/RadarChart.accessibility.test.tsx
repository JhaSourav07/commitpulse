import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RadarChart from './RadarChart';

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, className, ...props }: any) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'whileInView', 'viewport', 'transition'].includes(key)) {
            acc[key] = props[key as keyof typeof props];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      return (
        <div className={className} {...validProps}>
          {children}
        </div>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    polygon: ({ children, ...props }: any) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition'].includes(key)) {
            acc[key] = props[key as keyof typeof props];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      return <polygon {...validProps}>{children}</polygon>;
    },
  },
}));

describe('RadarChart Accessibility Standards & Screen Reader Aria Compliance', () => {
  const languagesA = [
    { name: 'TypeScript', percentage: 60, color: '#3178c6' },
    { name: 'JavaScript', percentage: 30, color: '#f7df1e' },
  ];

  const languagesB = [
    { name: 'TypeScript', percentage: 40, color: '#3178c6' },
    { name: 'Python', percentage: 50, color: '#3776ab' },
  ];

  it('inspects markup for accessible heading and descriptive chart labels', () => {
    render(
      <RadarChart
        languagesA={languagesA}
        languagesB={languagesB}
        labelA="Vaibhav"
        labelB="Contributor"
      />
    );

    expect(
      screen.getByRole('heading', { level: 3, name: /language dominance/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/radar comparison/i)).toBeInTheDocument();
    expect(screen.getByText('Vaibhav')).toBeInTheDocument();
    expect(screen.getByText('Contributor')).toBeInTheDocument();
  });

  it('asserts chart content remains readable through visible language labels', () => {
    render(
      <RadarChart
        languagesA={languagesA}
        languagesB={languagesB}
        labelA="Vaibhav"
        labelB="Contributor"
      />
    );

    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
  });

  it('verifies tooltip-like percentage descriptions are announced as visible text', () => {
    render(
      <RadarChart
        languagesA={languagesA}
        languagesB={languagesB}
        labelA="Vaibhav"
        labelB="Contributor"
      />
    );

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('tests keyboard control path when the chart has no interactive focus targets', async () => {
    render(
      <RadarChart
        languagesA={languagesA}
        languagesB={languagesB}
        labelA="Vaibhav"
        labelB="Contributor"
      />
    );

    await import('@testing-library/user-event').then(async ({ default: userEvent }) => {
      const user = userEvent.setup();
      await user.tab();
      expect(document.body).toHaveFocus();
    });
  });

  it('confirms empty state exposes accessible fallback text when no language data exists', () => {
    render(<RadarChart languagesA={[]} languagesB={[]} labelA="Vaibhav" labelB="Contributor" />);

    expect(screen.getByText(/no language data to compare yet/i)).toBeInTheDocument();
  });
});
