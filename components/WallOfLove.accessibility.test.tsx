import { vi } from 'vitest';

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
    context: vi.fn((cb) => {
      cb();
      return {
        revert: vi.fn(),
      };
    }),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WallOfLove } from './WallOfLove';
describe('WallOfLove accessibility', () => {
  it('renders the main heading', () => {
    render(<WallOfLove />);

    expect(
      screen.getByRole('heading', {
        name: /wall/i,
      })
    ).toBeTruthy();
  });

  it('renders avatars with alt text', () => {
    render(<WallOfLove />);

    const images = screen.getAllByRole('img');

    expect(images.length).toBeGreaterThan(0);

    images.forEach((image) => {
      const alt = image.getAttribute('alt') || image.getAttribute('aria-label');
      expect(alt).toBeTruthy();
    });
  });

  it('renders accessibility badge text', () => {
    render(<WallOfLove />);

    expect(screen.getByText(/loved by developers worldwide/i)).toBeTruthy();
  });

  it('renders statistics labels', () => {
    render(<WallOfLove />);

    expect(screen.getByText(/happy developers/i)).toBeTruthy();
    expect(screen.getByText(/badges generated/i)).toBeTruthy();
    expect(screen.getByText(/average rating/i)).toBeTruthy();
  });

  it('renders testimonial handles for screen readers', () => {
    render(<WallOfLove />);

    expect(screen.getAllByText('@alexcodes').length).toBeGreaterThan(0);
  });
});
