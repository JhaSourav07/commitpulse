import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContributionCity3D from './ContributionCity3D';
import type { ActivityData } from '@/types/dashboard';

// ── Canvas2D mock ──────────────────────────────────────────────────────────
// jsdom does not implement a real 2D rendering context, so we stub just
// enough of it for draw() to execute end-to-end without throwing.
const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  ellipse: vi.fn(),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  globalAlpha: 1,
};

// ── ResizeObserver mock – must be a class (constructable) ───────────────────
class MockResizeObserver {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe() {
    this.cb(
      [{ contentRect: { width: 800, height: 360 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.ResizeObserver = MockResizeObserver as any;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────
function makeActivity(n = 14): ActivityData[] {
  return Array.from({ length: n }, (_, i) => ({
    date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
    count: i % 7 === 0 ? 0 : (i % 4) + 1,
    intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
  }));
}

// Embeds the widget in a fixture page so we can verify it doesn't disturb
// the surrounding document's accessibility tree (tab order, headings, etc).
const renderInFixturePage = () =>
  render(
    <>
      <a href="#content">Skip to content</a>
      <main id="content" aria-labelledby="page-title">
        <h1 id="page-title">Dashboard</h1>
        <section aria-labelledby="activity-title">
          <h2 id="activity-title">Activity</h2>
          <button type="button" data-testid="before">
            Before
          </button>
          <ContributionCity3D data={makeActivity()} theme="dark" />
          <button type="button" data-testid="after">
            After
          </button>
        </section>
      </main>
    </>
  );

describe('ContributionCity3D Accessibility', () => {
  it('does not give the canvas a tabindex or pull it into the tab order', async () => {
    const user = userEvent.setup();
    const { container } = renderInFixturePage();

    const canvas = container.querySelector('canvas')!;
    expect(canvas).not.toHaveAttribute('tabindex');

    await user.tab(); // skip link
    await user.tab(); // "before" button
    expect(screen.getByTestId('before')).toHaveFocus();

    // Tab moves from "before" to "Replay My Year" button, then to "after" — the canvas is not a stop.
    await user.tab();
    expect(screen.getByRole('button', { name: /replay my year/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByTestId('after')).toHaveFocus();
    expect(canvas).not.toHaveFocus();
  });

  it('renders the canvas without a role or accessible name', () => {
    const { container } = render(<ContributionCity3D data={makeActivity()} theme="dark" />);
    const canvas = container.querySelector('canvas')!;

    expect(canvas).not.toHaveAttribute('role');
    expect(canvas).not.toHaveAttribute('aria-label');
    expect(canvas).not.toHaveAttribute('aria-labelledby');
    expect(canvas).not.toHaveAttribute('aria-describedby');
  });

  it('exposes the rotate/zoom hint as visible, non-hidden text', () => {
    render(<ContributionCity3D data={makeActivity()} theme="dark" />);

    const hint = screen.getByText(/drag to rotate/i);
    expect(hint).toBeVisible();
    expect(hint).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render an orphaned tooltip node when no hover target has been set', () => {
    render(<ContributionCity3D data={makeActivity()} theme="dark" />);

    expect(screen.queryByText(/contribution/i)).not.toBeInTheDocument();
  });

  it('has no broken aria-labelledby references', () => {
    renderInFixturePage();

    const elementsWithLabelledBy = document.querySelectorAll('[aria-labelledby]');
    const missingIds: string[] = [];

    elementsWithLabelledBy.forEach((el) => {
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/);
      ids.forEach((id) => {
        if (id && !document.getElementById(id)) {
          missingIds.push(id);
        }
      });
    });

    expect(missingIds).toEqual([]);
  });

  it('has no broken aria-describedby references', () => {
    renderInFixturePage();

    const elementsWithDescribedBy = document.querySelectorAll('[aria-describedby]');
    const missingIds: string[] = [];

    elementsWithDescribedBy.forEach((el) => {
      const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
      ids.forEach((id) => {
        if (id && !document.getElementById(id)) {
          missingIds.push(id);
        }
      });
    });

    expect(missingIds).toEqual([]);
  });

  it('does not introduce duplicate element ids when rendered more than once', () => {
    render(
      <>
        <ContributionCity3D data={makeActivity()} theme="dark" />
        <ContributionCity3D data={makeActivity()} theme="neon" />
      </>
    );

    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.getAttribute('id'));
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('does not disturb keyboard tab order or heading hierarchy when embedded in a page', async () => {
    const user = userEvent.setup();
    renderInFixturePage();

    await user.tab();
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByTestId('before')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /replay my year/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByTestId('after')).toHaveFocus();

    const headings = screen.getAllByRole('heading').map((heading) => ({
      level: Number(heading.tagName.slice(1)),
      name: heading.textContent,
    }));

    expect(headings).toEqual([
      { level: 1, name: 'Dashboard' },
      { level: 2, name: 'Activity' },
    ]);
  });

  it('remains accessible across all available themes (no role/label regressions)', () => {
    const themes = ['dark', 'neon', 'synthwave', 'dracula', 'ocean', 'forest', 'github', 'rose'];

    themes.forEach((theme) => {
      const { container, unmount } = render(
        <ContributionCity3D data={makeActivity()} theme={theme} />
      );
      const canvas = container.querySelector('canvas')!;

      expect(canvas).not.toHaveAttribute('role');
      expect(canvas).not.toHaveAttribute('tabindex');
      expect(screen.getByText(/drag to rotate/i)).toBeVisible();

      unmount();
    });
  });
});
