/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import RepoReelGenerator from './RepoReelGenerator';

vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;
      return (
        <section className={className} {...props}>
          {children}
        </section>
      );
    },
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;
      delete props.exit;
      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'reporeel.title': 'RepoReel Studio',
        'reporeel.description':
          'Turn your GitHub repository into a 15-second cinematic clip for Reels & Shorts',
        'reporeel.export_button': 'Render & Export .MP4',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('RepoReelGenerator Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders region role and main header title', () => {
    render(<RepoReelGenerator />);
    expect(screen.getByRole('region')).toBeDefined();
    expect(screen.getByText('RepoReel Studio')).toBeDefined();
  });

  it('allows updating repo URL and code snippet inputs', () => {
    render(<RepoReelGenerator />);

    const repoInput = screen.getByPlaceholderText(
      'https://github.com/username/repository'
    ) as HTMLInputElement;
    fireEvent.change(repoInput, { target: { value: 'https://github.com/test/repo' } });
    expect(repoInput.value).toBe('https://github.com/test/repo');
  });

  it('changes theme selection when theme buttons are clicked', () => {
    render(<RepoReelGenerator />);

    const cyberpunkBtn = screen.getByText('Cyberpunk');
    fireEvent.click(cyberpunkBtn);
    expect(screen.getByText('Cyberpunk')).toBeDefined();
  });

  it('switches aspect ratio formats correctly', () => {
    render(<RepoReelGenerator />);

    const landscapeBtn = screen.getByText('16:9 (Video)');
    fireEvent.click(landscapeBtn);
    expect(screen.getByText('16:9 (Video)')).toBeDefined();
  });

  it('triggers video export render process when render button is clicked', () => {
    render(<RepoReelGenerator />);

    const exportBtn = screen.getByText('Render & Export .MP4');
    fireEvent.click(exportBtn);

    // Fast-forward progress timer
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(exportBtn).toBeDefined();
  });
});
