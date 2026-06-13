import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { SuccessGuide } from './SuccessGuide';

type MockMotionProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <svg data-testid="close-icon" aria-hidden="true" />,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  markdown: '![CommitPulse](https://commitpulse.vercel.app/api/streak?user=testuser)',
  onDismiss: vi.fn(),
};

describe('SuccessGuide — Accessibility & Screen Reader Compliance', () => {
  it('renders as a named region landmark linked to h2 via aria-labelledby', () => {
    const { container } = render(<SuccessGuide {...defaultProps} />);

    const region = container.querySelector('[role="region"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-labelledby', 'success-guide-heading');

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id', 'success-guide-heading');
    expect(heading).toHaveTextContent('success_guide.title');
  });

  it('renders dismiss button with aria-label and correct button role', () => {
    render(<SuccessGuide {...defaultProps} />);

    const dismissButton = screen.getByRole('button', { name: 'Dismiss guide' });
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton.tagName).toBe('BUTTON');
  });

  it('renders steps grid with aria-label and all 4 step titles visible', () => {
    const { container } = render(<SuccessGuide {...defaultProps} />);

    const stepsGrid = container.querySelector('[aria-label="Steps to embed your badge"]');
    expect(stepsGrid).toBeInTheDocument();

    expect(screen.getByText('success_guide.step_1_title')).toBeInTheDocument();
    expect(screen.getByText('success_guide.step_2_title')).toBeInTheDocument();
    expect(screen.getByText('success_guide.step_3_title')).toBeInTheDocument();
    expect(screen.getByText('success_guide.step_4_title')).toBeInTheDocument();
  });

  it('renders step numbers as visible text for screen reader sequence announcement', () => {
    render(<SuccessGuide {...defaultProps} />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('renders markdown snippet in code element with aria-label and hides $ symbol', () => {
    const { container } = render(<SuccessGuide {...defaultProps} />);

    const codeEl = container.querySelector('code[aria-label="Your badge markdown snippet"]');
    expect(codeEl).toBeInTheDocument();
    expect(codeEl).toHaveTextContent(defaultProps.markdown);

    const dollar = container.querySelector('[aria-hidden="true"].select-none');
    expect(dollar).toBeInTheDocument();
    expect(dollar).toHaveTextContent('$');
  });
});
