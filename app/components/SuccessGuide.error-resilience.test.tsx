import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SuccessGuide } from './SuccessGuide';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Icons
vi.mock('./Icons', () => ({
  CloseIcon: () => <svg data-testid="close-icon" />,
}));

// Mock TranslationContext
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'success_guide.markdown_copied': 'Markdown Copied',
        'success_guide.title': 'Add to Your GitHub Profile',
        'success_guide.step_1_title': 'Open your profile README',
        'success_guide.step_1_body': 'Navigate to your GitHub profile repository.',
        'success_guide.step_2_title': 'Paste the snippet',
        'success_guide.step_2_body': 'Add the copied markdown to your README.',
        'success_guide.step_3_title': 'Commit your changes',
        'success_guide.step_3_body': 'Save and push your changes.',
        'success_guide.step_4_title': 'View your profile',
        'success_guide.step_4_body': 'Check your live GitHub profile.',
        'success_guide.copied_snippet_label': 'Your Snippet',
        'success_guide.color_tip': 'Tip: customize colors with URL params.',
      };
      return translations[key] || key;
    },
  }),
}));

const defaultProps = {
  markdown: '![CommitPulse](https://commitpulse.vercel.app/api/streak?user=testuser)',
  onDismiss: vi.fn(),
};

describe('SuccessGuide — error resilience', () => {
  it('renders without crashing when valid props are provided', () => {
    render(<SuccessGuide {...defaultProps} />);

    expect(screen.getByText('Add to Your GitHub Profile')).toBeInTheDocument();
    expect(screen.getByText('Markdown Copied')).toBeInTheDocument();
  });

  it('renders all 4 steps without throwing when translation context is available', () => {
    render(<SuccessGuide {...defaultProps} />);

    expect(screen.getByText('Open your profile README')).toBeInTheDocument();
    expect(screen.getByText('Paste the snippet')).toBeInTheDocument();
    expect(screen.getByText('Commit your changes')).toBeInTheDocument();
    expect(screen.getByText('View your profile')).toBeInTheDocument();
  });

  it('renders markdown snippet correctly without overflow or hydration errors', () => {
    render(<SuccessGuide {...defaultProps} />);

    const codeEl = screen.getByLabelText('Your badge markdown snippet');
    expect(codeEl).toBeInTheDocument();
    expect(codeEl.textContent).toBe(defaultProps.markdown);
  });

  it('calls onDismiss handler when close button is clicked without crashing', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<SuccessGuide {...defaultProps} onDismiss={onDismiss} />);

    const closeButton = screen.getByLabelText('Dismiss guide');
    await user.click(closeButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders region with correct aria label for screen reader accessibility', () => {
    render(<SuccessGuide {...defaultProps} />);

    const region = screen.getByRole('region', { name: 'Add to Your GitHub Profile' });
    expect(region).toBeInTheDocument();
  });
});
