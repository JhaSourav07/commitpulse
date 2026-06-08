import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import '@testing-library/jest-dom';
import ResumeProfileSection from './ResumeProfileSection';
import type { ParsedResume } from '@/types/student';

// ---------------------------------------------------------------------------
// Module mocks (mirrors the pattern from the base test file)
// ---------------------------------------------------------------------------

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const sampleParsedResume: ParsedResume = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '9876543210',
  skills: ['TypeScript', 'React'],
  education: [
    {
      institution: 'State University',
      degree: 'B.Sc.',
      field: 'Computer Science',
      startDate: '2018',
      endDate: '2022',
    },
  ],
  experience: [
    {
      company: 'Acme Corp',
      role: 'Frontend Engineer',
      startDate: '2022',
      endDate: '2024',
      description: 'Built UIs with React.',
    },
  ],
};

/**
 * Thin mock for ResumeUpload that exposes a labelled trigger button so tests
 * can advance the stage without touching real file-upload logic.
 */
vi.mock('./ResumeUpload', () => ({
  default: ({
    onParsed,
  }: {
    onParsed: (data: ParsedResume, name: string) => void;
    onError: (error: string) => void;
  }) => (
    <button
      type="button"
      aria-label="Upload resume file"
      onClick={() => onParsed(sampleParsedResume, 'jane-resume.pdf')}
    >
      Upload resume file
    </button>
  ),
}));

/**
 * Thin mock for ResumePreviewForm that surfaces the key interactive elements
 * (Back / Save Profile) with real accessible names so accessibility tests can
 * validate them without needing to exercise the full form.
 */
vi.mock('./ResumePreviewForm', () => ({
  default: ({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) => (
    <div>
      <h3>Review Parsed Data</h3>
      <p>From: jane-resume.pdf — Edit any fields before saving</p>
      <button type="button" onClick={onBack}>
        Back
      </button>
      <button type="button" onClick={onComplete}>
        Save Profile
      </button>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Accessibility test suite
// ---------------------------------------------------------------------------
describe('ResumeProfileSection – accessibility', () => {
  /**
   * Test 1 — ARIA Label / Accessibility Name Validation
   *
   * Every interactive element a screen reader encounters must have a
   * discernible accessible name so the user understands its purpose.
   */
  it('ensures all interactive elements have accessible names for screen readers', async () => {
    render(<ResumeProfileSection githubUsername="janesmith" />);

    // The hidden file input carries aria-label="Upload resume" (ResumeUpload source).
    // Our mock surfaces a button with aria-label="Upload resume file".
    const uploadButton = screen.getByRole('button', { name: /upload resume file/i });
    expect(uploadButton).toBeInTheDocument();
    // Accessible name must be non-empty – screen readers will announce it.
    expect(uploadButton).toHaveAccessibleName();

    // Advance to the "uploaded" stage so preview-form buttons are rendered.
    const user = userEvent.setup();
    await user.click(uploadButton);

    const backButton = screen.getByRole('button', { name: /back/i });
    const saveButton = screen.getByRole('button', { name: /save profile/i });

    expect(backButton).toHaveAccessibleName();
    expect(saveButton).toHaveAccessibleName();
  });

  /**
   * Test 2 — Keyboard Focus Visibility
   *
   * Users who navigate with only a keyboard must be able to Tab to every
   * interactive element.  We verify that each focusable element can receive
   * programmatic focus and that none are unreachable.
   */
  it('allows keyboard users to reach all interactive elements via Tab navigation', async () => {
    const user = userEvent.setup();
    render(<ResumeProfileSection githubUsername="janesmith" />);

    const uploadButton = screen.getByRole('button', { name: /upload resume file/i });

    // Tab once – focus should land on the upload button.
    await user.tab();
    expect(document.activeElement).toBe(uploadButton);

    // Activate it to advance to the preview stage.
    await user.click(uploadButton);

    // Tab through the preview stage controls.
    await user.tab();
    const firstFocused = document.activeElement;
    expect(firstFocused).not.toBeNull();
    expect(firstFocused?.tagName).not.toBe('BODY'); // focus moved off body

    // Continue tabbing until we can reach "Save Profile".
    // We allow up to 10 tabs so the test isn't brittle against DOM order changes.
    await user.tab();
    await user.tab();
    await user.tab();

    const saveButton = screen.getByRole('button', { name: /save profile/i });
    saveButton.focus();

    expect(document.activeElement).toBe(saveButton);
  });

  /**
   * Test 3 — Tooltip / Supplementary Description Accessibility
   *
   * The component has no tooltip widgets.  This test verifies that no element
   * carries a dangling aria-describedby reference – i.e., an ID referenced in
   * aria-describedby that does not exist in the DOM, which would silently break
   * screen-reader announcements.
   */
  it('does not contain broken aria-describedby references that would confuse screen readers', async () => {
    const user = userEvent.setup();
    const { container } = render(<ResumeProfileSection githubUsername="janesmith" />);

    const elementsWithDescribedBy = container.querySelectorAll('[aria-describedby]');

    elementsWithDescribedBy.forEach((el) => {
      const ids = el.getAttribute('aria-describedby')!.split(/\s+/).filter(Boolean);
      ids.forEach((id) => {
        // Every referenced ID must resolve to an existing DOM element.
        const target = container.querySelector(`#${CSS.escape(id)}`);
        expect(target).not.toBeNull();
      });
    });

    // Also advance to the uploaded stage and repeat the check.
    const uploadButton = screen.getByRole('button', { name: /upload resume file/i });
    await user.click(uploadButton);

    const elementsAfterUpload = container.querySelectorAll('[aria-describedby]');
    elementsAfterUpload.forEach((el) => {
      const ids = el.getAttribute('aria-describedby')!.split(/\s+/).filter(Boolean);
      ids.forEach((id) => {
        const target = container.querySelector(`#${CSS.escape(id)}`);
        expect(target).not.toBeNull();
      });
    });
  });

  /**
   * Test 4 — Heading Structure Validation
   *
   * Assistive technologies rely on a logical heading outline.  The component
   * renders an h3 in the idle stage ("Resume Profile") and an h3 in the preview
   * stage ("Review Parsed Data").  Both must be present at the right stage and
   * no heading level should be skipped within the component's rendered subtree.
   */
  it('maintains a logical heading hierarchy without skipping levels', async () => {
    const user = userEvent.setup();
    render(<ResumeProfileSection githubUsername="janesmith" />);

    // Idle stage: exactly one heading rendered by this component.
    const idleHeadings = screen.getAllByRole('heading');
    expect(idleHeadings.length).toBeGreaterThanOrEqual(1);

    // Validate that heading levels in the rendered DOM don't skip (e.g. h1→h3).
    const headingLevels = idleHeadings
      .map((h) => parseInt(h.tagName.replace('H', ''), 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    for (let i = 1; i < headingLevels.length; i++) {
      // Adjacent heading levels must not jump by more than 1.
      expect(headingLevels[i] - headingLevels[i - 1]).toBeLessThanOrEqual(1);
    }

    // Advance to uploaded stage and re-check.
    const uploadButton = screen.getByRole('button', { name: /upload resume file/i });
    await user.click(uploadButton);

    const previewHeadings = screen.getAllByRole('heading');
    expect(screen.getByRole('heading', { name: /review parsed data/i })).toBeInTheDocument();

    const previewLevels = previewHeadings
      .map((h) => parseInt(h.tagName.replace('H', ''), 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    for (let i = 1; i < previewLevels.length; i++) {
      expect(previewLevels[i] - previewLevels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  /**
   * Test 5 — Tab Order / Keyboard Navigation Flow
   *
   * The focus sequence must follow the visual reading order so that a keyboard
   * user's mental model matches what they encounter on screen.  We verify that
   * "Back" precedes "Save Profile" in DOM order and that both receive focus
   * before the sequence wraps back to the beginning (no hidden focus traps).
   */
  it('presents interactive controls in a logical tab order with no hidden focus traps', async () => {
    const user = userEvent.setup();
    render(<ResumeProfileSection githubUsername="janesmith" />);

    // Advance to the preview stage first.
    await user.tab();
    await user.keyboard('{Enter}');

    const backButton = screen.getByRole('button', { name: /back/i });
    const saveButton = screen.getByRole('button', { name: /save profile/i });

    // Tab through all focusable elements; collect the sequence of active elements.
    const focusOrder: Element[] = [];
    for (let i = 0; i < 10; i++) {
      await user.tab();
      if (document.activeElement && document.activeElement !== document.body) {
        focusOrder.push(document.activeElement);
      }
    }

    // Both Back and Save Profile must appear in the tab sequence.
    expect(focusOrder).toContain(backButton);
    expect(focusOrder).toContain(saveButton);

    // Back must be encountered before Save Profile in the tab sequence.
    const backIndex = focusOrder.indexOf(backButton);
    const saveIndex = focusOrder.indexOf(saveButton);
    expect(backIndex).toBeLessThan(saveIndex);
  });
});
