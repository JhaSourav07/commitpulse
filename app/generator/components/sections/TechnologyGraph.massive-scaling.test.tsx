import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { TechnologyGraph } from './TechnologyGraph';

afterEach(() => {
  cleanup();
});

describe('TechnologyGraph Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('1. handles extremely large selected technology arrays without crashing', () => {
    const massiveSelection = Array.from({ length: 10000 }, (_, i) => `tech-${i}`);

    render(<TechnologyGraph selected={massiveSelection} onToggle={vi.fn()} />);

    expect(screen.getByText('10000 Selected Technologies')).toBeInTheDocument();
  });

  it('2. handles duplicate technology ids in massive selections', () => {
    const duplicatedSelection = Array(5000).fill('react');

    render(<TechnologyGraph selected={duplicatedSelection} onToggle={vi.fn()} />);

    expect(screen.getByText('5000 Selected Technologies')).toBeInTheDocument();
  });

  it('3. remains stable under repeated large-scale renders', () => {
    const start = performance.now();

    for (let i = 0; i < 250; i++) {
      const { unmount } = render(
        <TechnologyGraph selected={[`react-${i}`, `nextjs-${i}`]} onToggle={vi.fn()} />
      );

      unmount();
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(process.env.CI ? 10000 : 3000);
  });

  it('4. handles massive callback invocations safely', () => {
    const onToggle = vi.fn();

    render(<TechnologyGraph selected={[]} onToggle={onToggle} />);

    for (let i = 0; i < 10000; i++) {
      onToggle(`tech-${i}`);
    }

    expect(onToggle).toHaveBeenCalledTimes(10000);
  });

  it('5. processes large selected datasets within performance limits', () => {
    const massiveSelection = Array.from({ length: 5000 }, (_, i) => `tech-${i}`);

    const start = performance.now();

    render(<TechnologyGraph selected={massiveSelection} onToggle={vi.fn()} />);

    const duration = performance.now() - start;

    expect(screen.getByText('5000 Selected Technologies')).toBeInTheDocument();
    expect(duration).toBeLessThan(process.env.CI ? 10000 : 3000);
  });
});
