import { render, screen } from '@testing-library/react';
import { HeroSection } from '../../app/components/HeroSection';

describe('HeroSection - Variation 2', () => {
  const setViewport = (width: number) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    setViewport(1024);
  });

  it('renders main heading', () => {
    render(<HeroSection />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('renders text content correctly', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Stop settling for flat grids/i)).toBeInTheDocument();
  });

  it('renders on mobile viewport', () => {
    setViewport(375);
    render(<HeroSection />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders on tablet viewport', () => {
    setViewport(768);
    render(<HeroSection />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
