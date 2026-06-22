import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from './FeatureCard';

const massiveTitle = 'A'.repeat(5000);
const massiveDesc = 'Description '.repeat(2000);

const props = {
  icon: <span>🚀</span>,
  title: 'Test Card',
  desc: 'Test Description',
  accent: 'text-emerald-400',
};

describe('FeatureCard Massive Scaling', () => {
  it('renders successfully with extremely large title content', () => {
    render(<FeatureCard {...props} title={massiveTitle} />);

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('renders successfully with extremely large description content', () => {
    render(<FeatureCard {...props} desc={massiveDesc} />);

    expect(screen.getByText((content) => content.includes('Description'))).toBeInTheDocument();
  });

  it('maintains structure during repeated high-volume mounts', () => {
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<FeatureCard {...props} />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();

      unmount();
    }
  });

  it('renders multiple massive cards independently', () => {
    render(
      <>
        <FeatureCard {...props} title={'Alpha'.repeat(1000)} />
        <FeatureCard {...props} title={'Beta'.repeat(1000)} />
      </>
    );

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('preserves icon and content containers under scaling conditions', () => {
    const { container } = render(
      <FeatureCard {...props} title={massiveTitle} desc={massiveDesc} />
    );

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();

    expect(container.querySelector('.bg-white\\/5')).toBeTruthy();
  });
});
