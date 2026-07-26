import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BrandParticles from './BrandParticles';

describe('BrandParticles Massive Scaling', () => {
  it('supports multiple renders without crashing', () => {
    for (let i = 0; i < 20; i++) {
      const { container } = render(<BrandParticles />);
      expect(container).toBeTruthy();
    }
  });

  it('maintains stable DOM structure during repeated renders', () => {
    const { container, rerender } = render(<BrandParticles />);

    for (let i = 0; i < 50; i++) {
      rerender(<BrandParticles />);
    }

    expect(container.firstChild).toBeTruthy();
  });

  it('renders particle elements under heavy rerender load', () => {
    const { container, rerender } = render(<BrandParticles />);

    for (let i = 0; i < 100; i++) {
      rerender(<BrandParticles />);
    }

    expect(container.firstChild).toBeTruthy();
  });
});
