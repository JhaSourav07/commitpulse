import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import ResumeUpload from './ResumeUpload';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

type Scheme = 'light' | 'dark';

/**
 * Simulates the environment for a given colour scheme.
 *
 * Tailwind's `dark:` variant relies on the `.dark` class being present on
 * <html>, and the component's drag-active overlay styles also branch on the
 * same class.  We therefore toggle both the match‑media result and the
 * document class so that the rendered markup reflects the correct theme.
 */
function mockThemeEnvironment(scheme: Scheme) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: query === `(prefers-color-scheme: ${scheme})`,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList
  );
  document.documentElement.classList.toggle('dark', scheme === 'dark');
  document.documentElement.style.colorScheme = scheme;
}

describe('ResumeUpload Theme Contrast', () => {
  const sharedProps = {
    onParsed: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  // ---------------------------------------------------------------------------
  // 1.  Dark‑mode rendering behaviour
  // ---------------------------------------------------------------------------
  it('renders theme‑aware classes in dark mode', () => {
    mockThemeEnvironment('dark');

    render(<ResumeUpload {...sharedProps} />);

    // Title – should carry the dark variant
    const title = screen.getByText(/drop your resume here/i);
    expect(title).toHaveClass('dark:text-white/80');

    // Helper text
    const helper = screen.getByText(/pdf or docx/i);
    expect(helper).toHaveClass('dark:text-white/50');

    // Upload icon
    const iconContainer = screen.getByRole('button', { name: /drop your resume here/i });
    const uploadIcon = iconContainer.querySelector('svg');
    expect(uploadIcon).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 2.  Light‑mode rendering behaviour
  // ---------------------------------------------------------------------------
  it('renders theme‑aware classes in light mode', () => {
    mockThemeEnvironment('light');

    render(<ResumeUpload {...sharedProps} />);

    // Title – light text class present
    const title = screen.getByText(/drop your resume here/i);
    expect(title).toHaveClass('text-gray-700');

    // Helper text – light text class present
    const helper = screen.getByText(/pdf or docx/i);
    expect(helper).toHaveClass('text-gray-500');

    // The `text-gray-500` class is the light-mode baseline; the `dark:` variant
    // is always present in the DOM because Tailwind applies CSS at runtime.
    // We verify the light-mode class is applied correctly.
    expect(helper).toHaveClass('text-gray-500');
    expect(helper).toHaveClass('dark:text-white/50');

    // Dropzone should have light border
    const dropzone = screen.getByRole('button', { name: /drop your resume here/i });
    expect(dropzone).toHaveClass('border-black/10');
  });

  // ---------------------------------------------------------------------------
  // 3.  Theme‑specific Tailwind utility classes on the dropzone container
  // ---------------------------------------------------------------------------
  it('applies theme‑specific border and hover styling to the dropzone', () => {
    // First check dark mode
    mockThemeEnvironment('dark');
    const { unmount } = render(<ResumeUpload {...sharedProps} />);
    const darkDropzone = screen.getByRole('button', { name: /drop your resume here/i });

    expect(darkDropzone).toHaveClass('dark:border-[rgba(255,255,255,0.15)]');
    expect(darkDropzone).toHaveClass('dark:hover:bg-white/5');

    unmount();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';

    // Now check light mode
    mockThemeEnvironment('light');
    render(<ResumeUpload {...sharedProps} />);
    const lightDropzone = screen.getByRole('button', { name: /drop your resume here/i });

    expect(lightDropzone).toHaveClass('border-black/10');
    expect(lightDropzone).toHaveClass('hover:bg-gray-50');
    // The `dark:` variant classes are always in the DOM — Tailwind resolves
    // them at runtime based on the `.dark` class on <html>.
    expect(lightDropzone).toHaveClass('dark:border-[rgba(255,255,255,0.15)]');
  });

  // ---------------------------------------------------------------------------
  // 4.  Overlay / background‑layer colour safety (drag‑active state)
  // ---------------------------------------------------------------------------
  it('keeps the drag‑active overlay translucent so foreground content remains visible', () => {
    mockThemeEnvironment('dark');

    const { container } = render(<ResumeUpload {...sharedProps} />);
    const dropzone = screen.getByRole('button', { name: /drop your resume here/i });

    // Simulate drag‑enter to activate the overlay
    fireEvent.dragEnter(dropzone);

    // The dragged state applies: border-emerald-500 bg-emerald-500/5
    expect(dropzone).toHaveClass('border-emerald-500');
    expect(dropzone).toHaveClass('bg-emerald-500/5');

    // The foreground text should still be visible – the overlay uses a
    // translucent background (5 % opacity) that does not clip content.
    const title = screen.getByText(/drop your resume here/i);
    expect(title).toBeVisible();
    expect(title).toHaveClass('dark:text-white/80');

    // The helper text must also be visible
    const helper = screen.getByText(/pdf or docx/i);
    expect(helper).toBeVisible();
    expect(helper).toHaveClass('dark:text-white/50');
  });

  // ---------------------------------------------------------------------------
  // 5.  Uploading state – foreground/background visual compatibility
  // ---------------------------------------------------------------------------
  it('preserves theme‑safe text legibility during the uploading state', async () => {
    mockThemeEnvironment('dark');

    // Use a delayed fetch so the uploading state stays visible long enough
    // for assertions while the component awaits the response.
    let resolvePromise!: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValue(
          fetchPromise.then(() =>
            Promise.resolve(
              new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })
            )
          )
        )
    );

    render(<ResumeUpload {...sharedProps} />);

    const input = screen.getByLabelText(/upload resume/i) as HTMLInputElement;

    const file = new File(['fake content'], 'resume.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    // The component transitions to the uploading state immediately after
    // a valid file is selected.
    const uploadingText = await screen.findByText(/parsing resume/i);

    expect(uploadingText).toHaveClass('dark:text-white/70');
    expect(uploadingText).toHaveClass('text-gray-600');

    // The spinner should have a theme‑neutral colour
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('text-emerald-500');

    // Clean up by resolving the pending fetch
    resolvePromise(null);
  });
});
