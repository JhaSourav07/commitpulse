import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

/**
 * Real component-level tests for EditorPanel.
 *
 * EditorPanel is a pure controlled component: it renders five child section
 * editors (Name, Description, Technologies, Socials, CommitPulse) and wires
 * each one's onChange callback to a prop.  These tests verify:
 *
 *   1. All five sections render in the document.
 *   2. Typing in the name field fires onNameChange with the new value.
 *   3. Typing in the description textarea fires onDescriptionChange.
 *   4. Description enforces the 280-character limit.
 *   5. Description counter goes amber when fewer than 40 chars remain.
 *   6. The CommitPulse toggle switch fires onShowCommitPulseChange.
 *   7. The CommitPulse section is gated behind the toggle (username input only
 *      visible when showCommitPulse = true).
 *   8. Typing a valid accent hex calls onCommitPulseAccentChange.
 *   9. An invalid accent hex shows the "Invalid hex" warning.
 *  10. Collapsing a SectionCard via its header hides the section body.
 */

const makeState = (overrides: Partial<GeneratorState> = {}): GeneratorState => ({
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: '',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
  ...overrides,
});

const makeHandlers = () => ({
  onNameChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onTechsChange: vi.fn(),
  onSocialsChange: vi.fn(),
  onSocialLinkChange: vi.fn(),
  onGithubUsernameChange: vi.fn(),
  onShowCommitPulseChange: vi.fn(),
  onCommitPulseAccentChange: vi.fn(),
  onApplyImport: vi.fn(),
});

// ── 1. Section presence ───────────────────────────────────────────────────────

describe('EditorPanel — section rendering', () => {
  it('renders the Name section heading', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders the Description section heading', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders the Technologies section heading', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);
    expect(screen.getByText('Technologies')).toBeInTheDocument();
  });

  it('renders the Socials section heading', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);
    expect(screen.getByText('Socials')).toBeInTheDocument();
  });

  it('renders the CommitPulse Badge section heading', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);
    expect(screen.getByText('CommitPulse Badge')).toBeInTheDocument();
  });
});

// ── 2 & 3. onChange callbacks ─────────────────────────────────────────────────

describe('EditorPanel — controlled input callbacks', () => {
  it('calls onNameChange with the typed value', async () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);

    const input = screen.getByPlaceholderText(/e\.g\. Omkar/i);
    fireEvent.change(input, { target: { value: 'A' } });

    expect(h.onNameChange).toHaveBeenLastCalledWith('A');
  });

  it('reflects controlled value in the name input', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ name: 'Fawaz' })} {...h} />);
    expect(screen.getByDisplayValue('Fawaz')).toBeInTheDocument();
  });

  it('calls onDescriptionChange when the bio textarea changes', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);

    const textarea = screen.getByPlaceholderText(/full-stack developer/i);
    fireEvent.change(textarea, { target: { value: 'H' } });

    expect(h.onDescriptionChange).toHaveBeenLastCalledWith('H');
  });
});

// ── 4. 280-char description limit ────────────────────────────────────────────

describe('EditorPanel — DescriptionSection character limit', () => {
  it('shows "280 characters remaining" for an empty description', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ description: '' })} {...h} />);
    expect(screen.getByText('280 characters remaining')).toBeInTheDocument();
  });

  it('decrements the counter as text is added', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ description: 'Hello' })} {...h} />);
    expect(screen.getByText('275 characters remaining')).toBeInTheDocument();
  });

  // ── 5. amber warning at < 40 chars remaining ──────────────────────────────
  it('counter text turns amber when fewer than 40 characters remain', () => {
    const h = makeHandlers();
    const nearLimit = 'x'.repeat(242); // 280 - 242 = 38 remaining
    render(<EditorPanel state={makeState({ description: nearLimit })} {...h} />);
    const counter = screen.getByText('38 characters remaining');
    expect(counter).toHaveClass('text-amber-500');
  });
});

// ── 6 & 7. CommitPulse toggle ─────────────────────────────────────────────────

describe('EditorPanel — CommitPulseSection toggle', () => {
  it('hides the GitHub username input when showCommitPulse is false', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ showCommitPulse: false })} {...h} />);
    expect(screen.queryByPlaceholderText(/OmkarArdekar12/i)).toBeNull();
  });

  it('shows the GitHub username input when showCommitPulse is true', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ showCommitPulse: true })} {...h} />);
    expect(screen.getByPlaceholderText(/OmkarArdekar12/i)).toBeInTheDocument();
  });

  it('calls onShowCommitPulseChange(true) when the toggle is clicked while off', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ showCommitPulse: false })} {...h} />);
    const toggle = screen.getByRole('switch', { name: /toggle commitpulse badge/i });
    fireEvent.click(toggle);
    expect(h.onShowCommitPulseChange).toHaveBeenCalledWith(true);
  });

  it('calls onShowCommitPulseChange(false) when the toggle is clicked while on', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ showCommitPulse: true })} {...h} />);
    const toggle = screen.getByRole('switch', { name: /toggle commitpulse badge/i });
    fireEvent.click(toggle);
    expect(h.onShowCommitPulseChange).toHaveBeenCalledWith(false);
  });

  it('toggle aria-checked reflects the current showCommitPulse state', () => {
    const h = makeHandlers();
    const { rerender } = render(
      <EditorPanel state={makeState({ showCommitPulse: false })} {...h} />
    );
    expect(screen.getByRole('switch', { name: /toggle commitpulse badge/i })).toHaveAttribute(
      'aria-checked',
      'false'
    );

    rerender(<EditorPanel state={makeState({ showCommitPulse: true })} {...h} />);
    expect(screen.getByRole('switch', { name: /toggle commitpulse badge/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});

// ── 8 & 9. Accent colour input ────────────────────────────────────────────────

describe('EditorPanel — CommitPulseSection accent colour', () => {
  it('calls onCommitPulseAccentChange when typing a hex value', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState({ showCommitPulse: true })} {...h} />);

    const accentInput = screen.getByPlaceholderText('10b981');
    fireEvent.change(accentInput, { target: { value: 'a' } });

    expect(h.onCommitPulseAccentChange).toHaveBeenLastCalledWith('a');
  });

  it('shows "Invalid hex" warning for a partial / invalid hex string', () => {
    const h = makeHandlers();
    render(
      <EditorPanel state={makeState({ showCommitPulse: true, commitPulseAccent: 'xyz' })} {...h} />
    );
    expect(screen.getByText(/invalid hex/i)).toBeInTheDocument();
  });

  it('does NOT show an "Invalid hex" warning for a valid 6-char hex', () => {
    const h = makeHandlers();
    render(
      <EditorPanel
        state={makeState({ showCommitPulse: true, commitPulseAccent: '10b981' })}
        {...h}
      />
    );
    expect(screen.queryByText(/invalid hex/i)).toBeNull();
  });

  it('shows a "Clear" button when the accent is a valid hex', () => {
    const h = makeHandlers();
    render(
      <EditorPanel
        state={makeState({ showCommitPulse: true, commitPulseAccent: '10b981' })}
        {...h}
      />
    );
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('clicking Clear calls onCommitPulseAccentChange with an empty string', () => {
    const h = makeHandlers();
    render(
      <EditorPanel
        state={makeState({ showCommitPulse: true, commitPulseAccent: '10b981' })}
        {...h}
      />
    );
    fireEvent.click(screen.getByText('Clear'));
    expect(h.onCommitPulseAccentChange).toHaveBeenCalledWith('');
  });
});

// ── 10. SectionCard collapse ──────────────────────────────────────────────────

describe('EditorPanel — SectionCard collapsible behaviour', () => {
  it('hides the name input after the Name section header is clicked', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);

    // The Name section header button contains the title text
    const nameHeader = screen.getByRole('button', { name: /^name/i });
    fireEvent.click(nameHeader);

    expect(screen.queryByPlaceholderText(/e\.g\. Omkar/i)).toBeNull();
  });

  it('reveals the name input again when the collapsed header is re-clicked', () => {
    const h = makeHandlers();
    render(<EditorPanel state={makeState()} {...h} />);

    const nameHeader = screen.getByRole('button', { name: /^name/i });
    fireEvent.click(nameHeader); // collapse
    fireEvent.click(nameHeader); // expand

    expect(screen.getByPlaceholderText(/e\.g\. Omkar/i)).toBeInTheDocument();
  });
});
