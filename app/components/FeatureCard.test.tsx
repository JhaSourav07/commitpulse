import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';

// Same deal as the CTA test — framer-motion's whileHover and animation props
// don't mean anything to jsdom, so we stub motion.div with a plain div.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const TestIcon = () => <svg data-testid="test-icon" aria-label="feature icon" />;

describe('FeatureCard', () => {
  const defaultProps = {
    icon: <TestIcon />,
    title: 'Zero Config',
    desc: 'Drop in your username and go. No tokens, no setup.',
    accent: 'text-emerald-400',
  };

  describe('text content', () => {
    it('renders the title', () => {
      render(<FeatureCard {...defaultProps} />);

      expect(screen.getByText('Zero Config')).toBeTruthy();
    });

    it('renders the description', () => {
      render(<FeatureCard {...defaultProps} />);

      expect(screen.getByText('Drop in your username and go. No tokens, no setup.')).toBeTruthy();
    });

    it('renders an empty title without crashing', () => {
      render(<FeatureCard {...defaultProps} title="" />);

      // No title text, but the component should still mount cleanly.
      expect(screen.getByText('Drop in your username and go. No tokens, no setup.')).toBeTruthy();
    });

    it('renders an empty description without crashing', () => {
      render(<FeatureCard {...defaultProps} desc="" />);

      expect(screen.getByText('Zero Config')).toBeTruthy();
    });
  });

  describe('document structure', () => {
    it('renders the title inside an <h3>', () => {
      render(<FeatureCard {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading.textContent).toContain('Zero Config');
    });

    it('renders the description inside a <p>', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);

      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toContain('Drop in your username and go.');
    });
  });

  describe('icon slot', () => {
    it('renders the icon', () => {
      render(<FeatureCard {...defaultProps} />);

      expect(screen.getByTestId('test-icon')).toBeTruthy();
    });

    it('accepts any ReactNode as the icon, not just SVGs', () => {
      render(<FeatureCard {...defaultProps} icon={<span data-testid="emoji-icon">🔥</span>} />);

      expect(screen.getByTestId('emoji-icon')).toBeTruthy();
      expect(screen.getByText('🔥')).toBeTruthy();
    });

    it('accepts a plain text string as the icon', () => {
      render(<FeatureCard {...defaultProps} icon="★" />);

      expect(screen.getByText('★')).toBeTruthy();
    });
  });

  describe('accent styling', () => {
    it('applies the accent class to the icon wrapper', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);

      expect(container.querySelector('.text-emerald-400')).toBeTruthy();
    });

    it('applies a different accent class when a different accent is given', () => {
      const { container } = render(<FeatureCard {...defaultProps} accent="text-purple-400" />);

      expect(container.querySelector('.text-purple-400')).toBeTruthy();
      // The previous accent should not be present — it wasn't in defaultProps here.
      expect(container.querySelector('.text-emerald-400')).toBeFalsy();
    });

    it('keeps the base icon wrapper classes alongside the accent', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);

      // The icon wrapper always has bg-white/5 for the subtle background tint.
      const iconWrapper = container.querySelector('.bg-white\\/5');
      expect(iconWrapper).toBeTruthy();
    });
  });

  describe('multiple instances', () => {
    it('renders two cards side by side without their content bleeding into each other', () => {
      render(
        <>
          <FeatureCard {...defaultProps} title="Card One" desc="First description." />
          <FeatureCard {...defaultProps} title="Card Two" desc="Second description." />
        </>
      );

      expect(screen.getByText('Card One')).toBeTruthy();
      expect(screen.getByText('Card Two')).toBeTruthy();
      expect(screen.getByText('First description.')).toBeTruthy();
      expect(screen.getByText('Second description.')).toBeTruthy();
    });

    it('renders two independent headings when two cards are mounted', () => {
      render(
        <>
          <FeatureCard {...defaultProps} title="Alpha" desc="Alpha desc." />
          <FeatureCard {...defaultProps} title="Beta" desc="Beta desc." />
        </>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
    });
  });
});
