import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FeatureCard, FeatureCardsSection } from './FeatureCards';

// Mock GSAP
const mockTimeline = {
  to: vi.fn().mockReturnThis(),
  fromTo: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  kill: vi.fn(),
};

vi.mock('gsap', () => {
  const gsapMock = {
    registerPlugin: vi.fn(),
    context: (cb: () => void) => {
      cb();
      return { revert: vi.fn() };
    },
    timeline: () => mockTimeline,
    to: vi.fn().mockImplementation((target, vars) => {
      if (typeof vars.onComplete === 'function') {
        vars.onComplete();
      }
      return mockTimeline;
    }),
    fromTo: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  return {
    default: gsapMock,
    ...gsapMock,
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

describe('FeatureCards Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FeatureCard Component', () => {
    const defaultProps = {
      icon: <span data-testid="test-icon">💡</span>,
      title: 'Amazing Visuals',
      desc: 'Beautiful SVG isometric rendering of your commits.',
      accent: 'text-emerald-500',
      index: 1,
      accentColor: '#10b981',
    };

    it('renders card title, description and icon correctly', () => {
      render(<FeatureCard {...defaultProps} />);

      expect(screen.getByText('Amazing Visuals')).toBeInTheDocument();
      expect(
        screen.getByText('Beautiful SVG isometric rendering of your commits.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders background gradient blob and accent line matching the accentColor', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);

      // The background blob has class "absolute -right-20 -top-20"
      const blob = container.querySelector('.absolute.-right-20.-top-20') as HTMLElement;
      expect(blob).toBeInTheDocument();
      expect(blob.style.background).toBeTruthy();

      // The bottom accent line has class "absolute bottom-0 left-0"
      const accentLine = container.querySelector('.absolute.bottom-0.left-0') as HTMLElement;
      expect(accentLine).toBeInTheDocument();
      expect(accentLine.style.background).toMatch(/rgb\(16, 185, 129\)|#10b981/);
    });

    it('triggers mouse movement and hover hover-effects to activate magnetic spotlight', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);
      const card = container.firstChild as HTMLDivElement;

      // Mouse enter triggers hover state
      fireEvent.mouseEnter(card);

      // Mouse move triggers magnetic movement recalculations
      fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });

      // Mouse leave resets magnetic coordinates
      fireEvent.mouseLeave(card);
    });
  });

  describe('FeatureCardsSection Wrapper Component', () => {
    it('renders children components and Why CommitPulse heading correctly', () => {
      render(
        <FeatureCardsSection>
          <div data-testid="child-card">Child Component</div>
        </FeatureCardsSection>
      );

      expect(screen.getByRole('heading', { name: 'Why CommitPulse?' })).toBeInTheDocument();
      expect(screen.getByTestId('child-card')).toBeInTheDocument();
    });
  });
});
