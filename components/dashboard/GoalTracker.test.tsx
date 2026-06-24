import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GoalTracker from './GoalTracker';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => {
      const safeProps = { ...props };
      delete safeProps.initial;
      delete safeProps.whileInView;
      delete safeProps.viewport;
      delete safeProps.transition;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
    form: ({
      children,
      className,
      onSubmit,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      onSubmit?: (e: React.FormEvent) => void;
      [key: string]: unknown;
    }) => {
      const safeProps = { ...props };
      delete safeProps.initial;
      delete safeProps.animate;
      delete safeProps.exit;
      delete safeProps.transition;
      return (
        <form className={className} onSubmit={onSubmit} {...safeProps}>
          {children}
        </form>
      );
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.goals.title': 'Contribution Goals',
        'dashboard.goals.monthly': 'Monthly Target',
        'dashboard.goals.yearly': 'Yearly Target',
        'dashboard.goals.remaining': '{{count}} commits remaining',
        'dashboard.goals.completed': 'Goal Achieved! 🎉',
        'dashboard.goals.edit': 'Edit Goals',
        'dashboard.goals.save': 'Save Changes',
      };
      return translations[key] || key;
    },
  }),
}));

describe('GoalTracker Component', () => {
  const username = 'test-user';

  // Format current month and year date strings
  const now = new Date();
  const yearStr = now.getFullYear().toString();
  const monthStr = `${yearStr}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  // Custom mock activity data
  const mockActivity = [
    { count: 10, date: `${monthStr}-01` },
    { count: 15, date: `${monthStr}-02` },
    // Some commits from last year or another month
    { count: 50, date: `${parseInt(yearStr, 10) - 1}-06-15` },
  ];

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders title and defaults correctly when localStorage is empty', () => {
    render(<GoalTracker username={username} activity={mockActivity} />);

    expect(screen.getByText('Contribution Goals')).toBeDefined();

    // Check default targets are rendered: Monthly 100, Yearly 1000
    // Monthly contributions: 10 + 15 = 25
    expect(screen.getByText('25 / 100')).toBeDefined();
    // Yearly contributions: 10 + 15 = 25 (the one from last year is excluded)
    expect(screen.getByText('25 / 1000')).toBeDefined();

    // Remaining commitments
    expect(screen.getByText('75 commits remaining')).toBeDefined();
    expect(screen.getByText('975 commits remaining')).toBeDefined();
  });

  it('calculates goal percentages correctly', () => {
    render(<GoalTracker username={username} activity={mockActivity} />);

    // 25 / 100 = 25%
    expect(screen.getByText('25%')).toBeDefined();
    // 25 / 1000 = 3% (Math.round(25/1000 * 100) = 3)
    expect(screen.getByText('3%')).toBeDefined();
  });

  it('switches to editing state and saves new goals to localStorage', () => {
    render(<GoalTracker username={username} activity={mockActivity} />);

    // Click edit button
    const editBtn = screen.getByLabelText('Edit Goals');
    fireEvent.click(editBtn);

    // Verify inputs are visible
    const monthlyInput = screen.getByLabelText('Monthly Target') as HTMLInputElement;
    const yearlyInput = screen.getByLabelText('Yearly Target') as HTMLInputElement;

    expect(monthlyInput).toBeDefined();
    expect(yearlyInput).toBeDefined();

    // Input new values
    fireEvent.change(monthlyInput, { target: { value: '50' } });
    fireEvent.change(yearlyInput, { target: { value: '500' } });

    // Save form
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    // Verify editing state closes and new values are shown
    // Contributions 25, new monthly goal 50
    expect(screen.getByText('25 / 50')).toBeDefined();
    // Contributions 25, new yearly goal 500
    expect(screen.getByText('25 / 500')).toBeDefined();

    // Remaining values updated
    expect(screen.getByText('25 commits remaining')).toBeDefined();
    expect(screen.getByText('475 commits remaining')).toBeDefined();

    // Local storage check
    const stored = window.localStorage.getItem(`commitpulse:goals:${username}`);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual({ monthly: 50, yearly: 500 });
  });

  it('displays Goal Achieved when goals are met or exceeded', () => {
    // Save high contributions in local storage or adjust defaults to meet them
    const highCommitActivity = [
      { count: 120, date: `${monthStr}-01` },
      { count: 900, date: `${monthStr}-02` },
    ];

    render(<GoalTracker username={username} activity={highCommitActivity} />);

    // Monthly: 1020 / 100 -> Achieved
    // Yearly: 1020 / 1000 -> Achieved
    const achievedTexts = screen.getAllByText('Goal Achieved! 🎉');
    expect(achievedTexts.length).toBe(2);
  });
});
