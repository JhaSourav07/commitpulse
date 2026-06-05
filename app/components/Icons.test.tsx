import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { CopyIcon, ZapIcon, BoxIcon, CheckIcon, CloseIcon } from './Icons';

describe('Icons', () => {
  it('renders all 5 icons as valid SVG elements without crashing', () => {
    const icons = [CopyIcon, ZapIcon, BoxIcon, CheckIcon, CloseIcon];

    icons.forEach((Icon) => {
      const { container } = render(<Icon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('renders CopyIcon with correct attributes', () => {
    const { container } = render(<CopyIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  it('renders ZapIcon with correct attributes', () => {
    const { container } = render(<ZapIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  it('renders BoxIcon with correct attributes', () => {
    const { container } = render(<BoxIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  it('renders CheckIcon with correct attributes including green stroke color', () => {
    const { container } = render(<CheckIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('stroke-width', '3');
    expect(svg).toHaveAttribute('stroke', '#10b981');
  });

  it('renders CloseIcon with correct attributes', () => {
    const { container } = render(<CloseIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '18');
    expect(svg).toHaveAttribute('height', '18');
    expect(svg).toHaveAttribute('stroke-width', '2.5');
  });
});
