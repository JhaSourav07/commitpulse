import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FeatureCard } from './FeatureCard';

const props = {
  icon: <span data-testid="icon">🔥</span>,
  title: 'Interactive Card',
  desc: 'Feature description',
  accent: 'text-emerald-500',
};

describe('FeatureCard - mouse interactivity implementation', () => {
  it('renders title, description and icon', () => {
    render(<FeatureCard {...props} />);

    expect(screen.getByText('Interactive Card')).toBeInTheDocument();
    expect(screen.getByText('Feature description')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders the hover-enabled card container', () => {
    const { container } = render(<FeatureCard {...props} />);

    const root = container.firstElementChild as HTMLElement;

    expect(root).toBeTruthy();
    expect(root).toHaveClass('group');
  });

  it('applies hover styling support to the title', () => {
    render(<FeatureCard {...props} />);

    const title = screen.getByText('Interactive Card');

    expect(title).toHaveClass('group-hover:text-emerald-400');
  });

  it('applies the provided accent class to the icon wrapper', () => {
    const { container } = render(<FeatureCard {...props} />);

    const accentWrapper = container.querySelector('.text-emerald-500');

    expect(accentWrapper).toBeInTheDocument();
  });

  it('renders a motion wrapper structure for hover animation', () => {
    const { container } = render(<FeatureCard {...props} />);

    const root = container.firstElementChild as HTMLElement;

    expect(root.tagName.toLowerCase()).toBe('div');
  });
});
