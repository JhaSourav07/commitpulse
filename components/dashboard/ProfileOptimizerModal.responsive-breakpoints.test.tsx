/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProfileOptimizerModal from './ProfileOptimizerModal';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const clean = { ...props };
      delete clean.initial;
      delete clean.animate;
      delete clean.exit;
      delete clean.transition;
      delete clean.onClick;
      return (
        <div className={className} {...clean}>
          {children}
        </div>
      );
    },
    p: ({ children, className, ...props }: any) => {
      const clean = { ...props };
      delete clean.initial;
      delete clean.animate;
      delete clean.exit;
      return (
        <p className={className} {...clean}>
          {children}
        </p>
      );
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Download: () => <span>Download</span>,
  Copy: () => <span>Copy</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  AlertCircle: () => <span>AlertCircle</span>,
}));

const mockUserData = {
  profile: {
    developerScore: 60,
    bio: 'Full-stack developer',
    stats: { repositories: 10, followers: 50 },
  },
  languages: [{ name: 'TypeScript' }, { name: 'Python' }],
  stats: { totalContributions: 200 },
};

describe('ProfileOptimizerModal — Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('renders modal container without fixed absolute widths that cause horizontal scroll', () => {
    const { container } = render(
      <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />
    );
    const modalDiv = container.querySelector('.max-w-3xl');
    expect(modalDiv).not.toBeNull();
    expect(modalDiv?.className).toContain('w-full');
    expect(modalDiv?.className).not.toContain('w-[');
  });

  it('renders close button accessible on mobile viewport', () => {
    render(<ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />);
    const closeButton = screen.getByTestId('icon-x');
    expect(closeButton).toBeDefined();
  });

  it('renders modal with vertical flex layout on small screens', () => {
    const { container } = render(
      <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />
    );
    const flexModal = container.querySelector('.flex.flex-col');
    expect(flexModal).not.toBeNull();
  });

  it('renders loading state with centered vertical layout on mobile', () => {
    const { container } = render(
      <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={mockUserData} />
    );
    const centered = container.querySelector('.flex-col.items-center.justify-center');
    expect(centered).not.toBeNull();
  });

  it('does not render modal content when isOpen is false', () => {
    const { container } = render(
      <ProfileOptimizerModal isOpen={false} onClose={vi.fn()} userData={mockUserData} />
    );
    expect(container.firstChild).toBeNull();
  });
});
