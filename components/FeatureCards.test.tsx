import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FeatureCard, FeatureCardsSection } from './FeatureCards';
import gsap from 'gsap';

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
      expect(accentLine.style.background).toContain('rgb(16, 185, 129)');
    });

    it('triggers mouse movement and hover-effects to activate magnetic spotlight', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);
      const card = container.firstChild as HTMLDivElement;

      // Mouse enter triggers hover state
      fireEvent.mouseEnter(card);
      expect(gsap.to).toHaveBeenCalled();

      vi.clearAllMocks();

      // Mouse move triggers magnetic movement recalculations
      fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
      expect(gsap.to).toHaveBeenCalled();

      vi.clearAllMocks();

      // Mouse leave resets magnetic coordinates
      fireEvent.mouseLeave(card);
      expect(gsap.to).toHaveBeenCalled();
    });
  });

  it('renders all 3 feature cards matching the defined list length', () => {
    render(
      <FeatureCardsSection>
        <FeatureCard
          icon={<span>⚡</span>}
          accent="text-white"
          accentColor="#10b981"
          index={0}
          title="Real-time Sync"
          desc="Pulled directly from GitHub GraphQL API. Your streak updates as fast as your code pushes."
        />
        <FeatureCard
          icon={<span>📋</span>}
          accent="text-white"
          accentColor="#8b5cf6"
          index={1}
          title="Theme Engine"
          desc="Switch between Neon, Dracula, or custom HEX modes via simple URL management."
        />
        <FeatureCard
          icon={<span>📦</span>}
          accent="text-white"
          accentColor="#06b6d4"
          index={2}
          title="Isometric Math"
          desc="Sophisticated 3D projection formulas turn 2D data into digital architecture."
        />
      </FeatureCardsSection>
    );

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(3);

    expect(screen.getByText('Real-time Sync')).toBeInTheDocument();
    expect(screen.getByText('Theme Engine')).toBeInTheDocument();
    expect(screen.getByText('Isometric Math')).toBeInTheDocument();
  });

  it('applies responsive grid layout classes to the card grid', () => {
    const { container } = render(
      <FeatureCardsSection>
        <div />
      </FeatureCardsSection>
    );
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-3');
    expect(grid).toHaveClass('gap-6');
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
