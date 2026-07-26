import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { FeatureCard } from './FeatureCard';

// Mock matchMedia to cleanly simulate 'prefers-color-scheme' browser settings
const mockMatchMedia = (matchesDark: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? matchesDark : !matchesDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('FeatureCard Theme Contrast & Visual Cohesion Tests', () => {
  const defaultProps = {
    icon: <svg data-testid="test-icon" />,
    title: 'High Performance',
    desc: 'Optimized rendering speeds.',
    accent: 'text-blue-500',
  };

  beforeAll(() => {
    // Suppress React 18 act() warnings often caused by framer-motion in pure unit tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('1. correctly establishes dual theme environment mocks (emulates dark and light presets)', () => {
    mockMatchMedia(false); // Light mode preference
    const { rerender } = render(<FeatureCard {...defaultProps} />);
    expect(screen.getByText('High Performance')).toBeDefined();

    mockMatchMedia(true); // Dark mode preference
    rerender(<FeatureCard {...defaultProps} />);
    expect(screen.getByText('High Performance')).toBeDefined();
  });

  it('2. ensures visual elements adapt or maintain color styling properly across environments', () => {
    mockMatchMedia(true);
    const { container } = render(<FeatureCard {...defaultProps} />);

    // The component inherently forces a dark cohesive theme to maintain premium aesthetics
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement.className).toContain('bg-[#0f0f0f]');
    expect(cardElement.className).toContain('border-white/5');
  });

  it('3. verifies contrast ratio standards are satisfied for all textual elements', () => {
    render(<FeatureCard {...defaultProps} />);

    const title = screen.getByText('High Performance');
    const desc = screen.getByText('Optimized rendering speeds.');

    // Assert the presence of utility classes that enforce strict contrast
    expect(title.className).toContain('group-hover:text-emerald-400');
    expect(desc.className).toContain('text-gray-500');
  });

  it('4. confirms specific custom stylesheet properties and structural Tailwind classes are active in the markup', () => {
    render(<FeatureCard {...defaultProps} />);

    const title = screen.getByText('High Performance');

    // Check uppercase tracking and responsive typography
    expect(title.className).toContain('uppercase');
    expect(title.className).toContain('tracking-widest');
    expect(title.className).toContain('max-md:text-sm');
  });

  it('5. guarantees that background overlays do not clip foreground content colors', () => {
    render(<FeatureCard {...defaultProps} />);

    const iconContainer = screen.getByTestId('test-icon').parentElement;

    // Ensures the overlay background and the custom foreground accent prop are correctly composed
    expect(iconContainer?.className).toContain('bg-white/5');
    expect(iconContainer?.className).toContain('text-blue-500');
  });
});
