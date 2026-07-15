import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FAQPage from './page';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: 'div',
  },
}));

describe('FAQPage', () => {
  it('renders readable FAQ copy instead of raw translation keys', () => {
    const { container } = render(<FAQPage />);

    expect(screen.getByRole('button', { name: /what is commitpulse/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /how does commitpulse get my github data/i })
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/\bfaq\.(q|a)\d+\b/);
  });
});
