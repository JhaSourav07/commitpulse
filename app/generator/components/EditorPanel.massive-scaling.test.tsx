import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

// Mock useDebounce hook to bypass the 500ms input debounce delay
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}));

// Setup base handlers
const makeHandlers = () => ({
  onNameChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onTechsChange: vi.fn(),
  onSocialsChange: vi.fn(),
  onSocialLinkChange: vi.fn(),
  onGithubUsernameChange: vi.fn(),
  onShowCommitPulseChange: vi.fn(),
  onCommitPulseAccentChange: vi.fn(),
  onShowSnakeGraphChange: vi.fn(),
  onShowPacmanGraphChange: vi.fn(),
  onGraphPlacementChange: vi.fn(),
  onApplyImport: vi.fn(),
});

// Setup base state helper
const makeState = (overrides: Partial<GeneratorState> = {}): GeneratorState => ({
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: '',
  showCommitPulse: false,
  commitPulseAccent: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
  ...overrides,
});

describe('EditorPanel - Massive Scaling & Extreme Bounds', () => {
  // Test Case 1: Name and Description Inputs with Massive Character Strings
  it('handles name and description with massive character strings without breaking or crashing', () => {
    const handlers = makeHandlers();
    const massiveName = 'A'.repeat(20000);
    const massiveDescription = 'B'.repeat(40000);

    const state = makeState({
      name: massiveName,
      description: massiveDescription,
    });

    render(<EditorPanel state={state} {...handlers} />);

    // Verify Name input field holds the value correctly
    const nameInput = screen.getByLabelText(/^display name$/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe(massiveName);

    // Verify Description textarea holds the value correctly
    const descTextarea = screen.getByLabelText(/^bio \/ tagline$/i) as HTMLTextAreaElement;
    expect(descTextarea).toBeInTheDocument();
    expect(descTextarea.value).toBe(massiveDescription);

    // Change input with an even larger name and check callback
    const newMassiveName = 'C'.repeat(30000);
    fireEvent.change(nameInput, { target: { value: newMassiveName } });
    expect(handlers.onNameChange).toHaveBeenCalledWith(newMassiveName);
  });

  // Test Case 2: Technologies Section Scaling (Massive Grid Load)
  it('renders Technologies Section with thousands of selected tech items without crashing', () => {
    const handlers = makeHandlers();
    // Simulate thousands of selected techs
    const massiveSelectedTechs = Array.from({ length: 5000 }, (_, i) => `tech-id-${i}`);
    const state = makeState({
      selectedTechs: massiveSelectedTechs,
    });

    const { container } = render(<EditorPanel state={state} {...handlers} />);

    // Assert that the component displays selected technologies counts properly
    const selectedCountLabel = screen.getByText(
      new RegExp(`Selected \\(${massiveSelectedTechs.length}\\)`, 'i')
    );
    expect(selectedCountLabel).toBeInTheDocument();

    const techGrid = container.querySelector('#technologies-section');
    expect(techGrid).toBeInTheDocument();
  });

  // Test Case 3: Socials Section Scaling (Massive URL Load)
  it('renders Socials Section with huge links properties under load without crashing', () => {
    const handlers = makeHandlers();
    const selectedSocials = Array.from({ length: 200 }, (_, i) => `social-${i}`);
    const socialLinks: Record<string, string> = {};
    selectedSocials.forEach((id) => {
      socialLinks[id] = 'https://custom-domain.com/' + 'a'.repeat(2000) + `/${id}`;
    });

    const state = makeState({
      selectedSocials,
      socialLinks,
    });

    render(<EditorPanel state={state} {...handlers} />);

    // Confirm that the Socials section card renders and mounts successfully
    expect(screen.getByText('Socials')).toBeInTheDocument();
  });

  // Test Case 4: Extreme Color Inputs & High Boundary Values for Graph Sections
  it('handles custom HEX color inputs and switch boundaries with emojis, special characters and long inputs', () => {
    const handlers = makeHandlers();
    const state = makeState({
      githubUsername: 'a'.repeat(10000), // Enormous username
      showCommitPulse: true,
      commitPulseAccent: '🚀emoji_invalid_hex_value_with_excessive_length!@#$',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'top',
    });

    render(<EditorPanel state={state} {...handlers} />);

    const usernameInput = screen.getByLabelText(/^github username$/i) as HTMLInputElement;
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput.value).toBe('a'.repeat(10000));

    // Warn message should render for the invalid hex
    expect(screen.getByText(/invalid hex/i)).toBeInTheDocument();
  });

  // Test Case 5: High-Frequency Update Performance Stress-Test
  it('renders and processes rapid state updates under heavy load efficiently', () => {
    const handlers = makeHandlers();
    const state = makeState();

    const { rerender } = render(<EditorPanel state={state} {...handlers} />);

    const start = performance.now();

    act(() => {
      for (let i = 0; i < 20; i++) {
        const updatedState = makeState({
          name: `User Name ${i}`,
          description: `Bio Description ${i} ` + 'x'.repeat(i),
          githubUsername: '',
          showCommitPulse: i % 2 === 0,
          commitPulseAccent: i % 2 === 0 ? '10b981' : '',
          showSnakeGraph: i % 2 === 0,
        });

        rerender(<EditorPanel state={updatedState} {...handlers} />);
      }
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
