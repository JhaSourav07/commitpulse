import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GithubWrapped from './GithubWrapped';
import type { UserProfile, WrappedStats } from '@/types/dashboard';

const emptyProfile: UserProfile = {
  username: '',
  name: '',
  avatarUrl: '/placeholder.png',
  isPro: false,
  bio: '',
  location: '',
  joinedDate: '',
  developerScore: 0,
  stats: {
    repositories: 0,
    followers: 0,
    following: 0,
    stars: 0,
  },
};

const emptyWrappedData: WrappedStats = {
  totalContributions: 0,
  topLanguage: '',
  highestDailyCount: 0,
  mostActiveDate: '',
  busiestMonth: '',
  weekendRatio: 0,
  calendar: {
    totalContributions: 0,
    weeks: [],
  },
};

describe('GithubWrapped - Edge Cases & Empty/Missing Inputs Verification (Variation 1)', () => {
  it('Render the target module or component with empty arrays or null parameters: Renders safely', () => {
    const { container } = render(
      <GithubWrapped profile={emptyProfile} wrappedData={emptyWrappedData} />
    );
    // Should render without crashing
    expect(container).toBeInTheDocument();
  });

  it('Verify that a clear, non-breaking fallback UI or error message is displayed: Zeroes and empty strings rendered safely', () => {
    render(<GithubWrapped profile={emptyProfile} wrappedData={emptyWrappedData} />);

    // Total contributions should render as "0"
    expect(screen.getByText('0')).toBeInTheDocument();

    // Busiest month fallback to empty string (which renders nothing but doesn't crash)
    // The text "The Weekend Grind" implies rendering reached the end safely
    expect(screen.getByText('The Weekend Grind')).toBeInTheDocument();
  });

  it('Verify standard styles are maintained in this default empty layout state: Validates structural classes', () => {
    const { container } = render(
      <GithubWrapped profile={emptyProfile} wrappedData={emptyWrappedData} />
    );

    // Validates that the outer container structure is maintained
    const mainDiv = container.querySelector('.max-w-2xl');
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass('overflow-hidden', 'bg-black');
  });

  it('Assert that no unexpected runtime errors or hydration failures occur: Splitting an empty month string works', () => {
    // Re-rendering specifically to ensure the `.split('-')` logic handles empty strings without throwing errors
    expect(() => {
      render(<GithubWrapped profile={emptyProfile} wrappedData={emptyWrappedData} />);
    }).not.toThrow();
  });

  it('Check key DOM structures to make sure empty markers exist: Developer score is 0', () => {
    render(<GithubWrapped profile={emptyProfile} wrappedData={emptyWrappedData} />);

    // Checks the footer section rendering the zero developer score
    expect(screen.getByText('Developer Score: 0/100')).toBeInTheDocument();
  });
});
