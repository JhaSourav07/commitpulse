import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import Achievements from './Achievements';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('Achievements - Empty/Missing Inputs', () => {
  it('renders successfully with an empty achievements array', () => {
    render(<Achievements achievements={[]} />);

    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('renders fallback layout without achievement cards', () => {
    render(<Achievements achievements={[]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('maintains grid container structure when data is empty', () => {
    const { container } = render(<Achievements achievements={[]} />);

    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('does not crash when locked achievement has missing progress fields', () => {
    const achievements = [
      {
        id: '1',
        title: 'Locked Achievement',
        description: 'Missing progress fields',
        type: 'streak',
        isUnlocked: false,
      },
    ];

    expect(() => render(<Achievements achievements={achievements as never[]} />)).not.toThrow();
  });

  it('renders toggle button when achievements exceed four items', () => {
    const achievements = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      title: `Achievement ${i}`,
      description: `Description ${i}`,
      type: 'streak',
      isUnlocked: true,
    }));

    render(<Achievements achievements={achievements as never[]} />);

    expect(
      screen.getByRole('button', {
        name: /see all achievements/i,
      })
    ).toBeInTheDocument();
  });
});
