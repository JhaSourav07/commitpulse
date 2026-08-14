import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TopRivalriesTicker from './TopRivalriesTicker';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

describe('TopRivalriesTicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component and mock rivalries', () => {
    render(<TopRivalriesTicker />);

    // Check if the rivalries are rendered
    // "torvalds" should be present (at least twice due to infinite loop mapping)
    const torvaldsElements = screen.getAllByText('torvalds');
    expect(torvaldsElements.length).toBeGreaterThanOrEqual(2);

    const reactLabelElements = screen.getAllByText('Kernel vs React');
    expect(reactLabelElements.length).toBeGreaterThanOrEqual(2);
  });

  it('labels the default list as example comparisons', () => {
    render(<TopRivalriesTicker />);

    expect(screen.getByRole('region', { name: 'Example comparisons' })).toBeInTheDocument();
    expect(screen.getByText('Example comparisons')).toBeInTheDocument();
  });

  it('does not show example label when custom rivalries are provided', () => {
    render(
      <TopRivalriesTicker
        rivalries={[
          {
            u1: 'alice',
            u2: 'bob',
            label: 'Live rivalry',
            icon: () => null,
            color: 'text-orange-500',
          },
        ]}
      />
    );

    expect(screen.getByRole('region', { name: 'Top rivalries' })).toBeInTheDocument();
    expect(screen.queryByText('Example comparisons')).not.toBeInTheDocument();
  });

  it('navigates to the correct URL on click', () => {
    render(<TopRivalriesTicker />);

    // Find the wrapper of the first rivalry (torvalds vs gaearon)
    // We can select it by finding the label and getting its parent
    const firstRivalryLabel = screen.getAllByText('Kernel vs React')[0];
    const rivalryContainer = firstRivalryLabel.closest('div.group');

    if (!rivalryContainer) {
      throw new Error('Rivalry container not found');
    }

    fireEvent.click(rivalryContainer);

    expect(mockPush).toHaveBeenCalledWith('/compare?user1=torvalds&user2=gaearon');
  });
});
