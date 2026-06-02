import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CopyRepoButton from './CopyRepoButton';

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

describe('CopyRepoButton Massive Scaling', () => {
  it('renders 100 buttons without crashing', () => {
    render(
      <>
        {Array.from({ length: 100 }).map((_, i) => (
          <CopyRepoButton key={i} />
        ))}
      </>
    );

    expect(screen.getAllByText('Copy URL')).toHaveLength(100);
  });

  it('renders 500 buttons without layout break', () => {
    render(
      <>
        {Array.from({ length: 500 }).map((_, i) => (
          <CopyRepoButton key={i} />
        ))}
      </>
    );

    expect(screen.getAllByRole('button')).toHaveLength(500);
  });

  it('renders icon for every button under heavy load', () => {
    render(
      <>
        {Array.from({ length: 200 }).map((_, i) => (
          <CopyRepoButton key={i} />
        ))}
      </>
    );

    expect(screen.getAllByTestId('copy-icon')).toHaveLength(200);
  });

  it('maintains button text consistency across many renders', () => {
    render(
      <>
        {Array.from({ length: 300 }).map((_, i) => (
          <CopyRepoButton key={i} />
        ))}
      </>
    );

    const buttons = screen.getAllByText('Copy URL');
    expect(buttons.length).toBe(300);
  });

  it('handles repeated mounting without throwing errors', () => {
    expect(() => {
      for (let i = 0; i < 50; i++) {
        render(<CopyRepoButton />);
      }
    }).not.toThrow();
  });
});
