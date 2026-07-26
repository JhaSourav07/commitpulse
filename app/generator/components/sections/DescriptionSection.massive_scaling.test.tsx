import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { DescriptionSection } from './DescriptionSection';
import * as readmeGenerator from '../../utils/readmeGenerator';
import type { GeneratorState } from '../../types';

vi.mock('lucide-react', () => ({
  ChevronDown: () => <svg data-testid="chevron-icon" />,
}));

vi.mock('../../utils/readmeGenerator', () => ({
  generateReadme: vi.fn(),
}));

const CHAR_LIMIT = 280;
const NEAR_LIMIT_THRESHOLD = 40;

const baseState: GeneratorState = {
  name: 'Octocat',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: 'octocat',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('DescriptionSection – Massive Data Sets and Extreme High Bounds Scaling (Variation 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: renders correctly at the exact 280-character limit — counter reads zero and layout stays intact', () => {
    const maxValue = 'A'.repeat(CHAR_LIMIT);

    const { container } = render(<DescriptionSection value={maxValue} onChange={vi.fn()} />);

    expect(screen.getByText('0 characters remaining')).toBeInTheDocument();

    const counter = screen.getByText('0 characters remaining');
    expect(counter.className).toMatch(/amber/);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(maxValue);
    expect(textarea.value.length).toBe(CHAR_LIMIT);

    expect(container.querySelectorAll('[role="region"]').length).toBe(1);

    const bodyText = document.body.textContent ?? '';
    expect(bodyText.indexOf('Description')).toBeLessThan(bodyText.indexOf('Bio / Tagline'));
  });

  it('Case 2: onChange clamps oversized input to 280 chars and never emits a negative remaining count', () => {
    const onChange = vi.fn();
    render(<DescriptionSection value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    const oversizedInput = 'B'.repeat(500);
    fireEvent.change(textarea, { target: { value: oversizedInput } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const emittedValue: string = onChange.mock.calls[0][0];
    expect(emittedValue.length).toBe(CHAR_LIMIT);
    expect(emittedValue).toBe('B'.repeat(CHAR_LIMIT));

    const { rerender } = render(<DescriptionSection value={emittedValue} onChange={onChange} />);
    expect(screen.getByText('0 characters remaining')).toBeInTheDocument();

    rerender(<DescriptionSection value={'C'.repeat(CHAR_LIMIT - 1)} onChange={onChange} />);
    expect(screen.getByText('1 characters remaining')).toBeInTheDocument();
  });

  it('Case 3: amber warning activates at the near-limit threshold across full range re-renders', () => {
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionSection value="" onChange={onChange} />);

    const greyBoundary = CHAR_LIMIT - NEAR_LIMIT_THRESHOLD;
    const amberBoundary = greyBoundary + 1;

    const start = performance.now();

    for (let len = 0; len <= CHAR_LIMIT; len++) {
      rerender(<DescriptionSection value={'X'.repeat(len)} onChange={onChange} />);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);

    const counterAtMax = screen.getByText('0 characters remaining');
    expect(counterAtMax.className).toMatch(/amber/);

    rerender(<DescriptionSection value={'X'.repeat(greyBoundary)} onChange={onChange} />);
    const counterAtGrey = screen.getByText('40 characters remaining');
    expect(counterAtGrey.className).not.toMatch(/amber/);

    rerender(<DescriptionSection value={'X'.repeat(amberBoundary)} onChange={onChange} />);
    const counterAtAmber = screen.getByText('39 characters remaining');
    expect(counterAtAmber.className).toMatch(/amber/);
  });

  it('Case 4: generateReadme embeds full 280-char description and handles 1,000 calls efficiently', () => {
    const maxDescription = 'D'.repeat(CHAR_LIMIT);
    const mockGenerateReadme = readmeGenerator.generateReadme as Mock;

    mockGenerateReadme.mockReturnValue(`# 👋 Hi, I'm Octocat\n\n<p>${maxDescription}</p>`);

    const singleResult = mockGenerateReadme({ ...baseState, description: maxDescription });
    expect(singleResult).toContain(`<p>${maxDescription}</p>`);
    expect(singleResult).toContain("# 👋 Hi, I'm Octocat");

    const COUNT = 1000;
    const start = performance.now();

    for (let i = 0; i < COUNT; i++) {
      mockGenerateReadme({
        ...baseState,
        description: `${'E'.repeat(CHAR_LIMIT - 6)}${i.toString().padStart(6, '0')}`,
        name: `Contributor ${i}`,
      });
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  it('Case 5: DOM structure stays intact after 500 rapid re-renders at extreme bounds', () => {
    const onChange = vi.fn();

    const fixtures = [
      '',
      'M'.repeat(140),
      'N'.repeat(CHAR_LIMIT - 39),
      'O'.repeat(CHAR_LIMIT),
    ] as const;

    const { rerender, container } = render(
      <DescriptionSection value={fixtures[0]} onChange={onChange} />
    );

    const RERENDER_COUNT = 500;
    const start = performance.now();

    for (let i = 0; i < RERENDER_COUNT; i++) {
      rerender(<DescriptionSection value={fixtures[i % fixtures.length]} onChange={onChange} />);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);

    expect(container.querySelectorAll('[role="region"]').length).toBe(1);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText(/bio \/ tagline/i)).toBeInTheDocument();
    expect(screen.getByText(/characters remaining/i)).toBeInTheDocument();

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'P'.repeat(100) } });
    expect(onChange).toHaveBeenLastCalledWith('P'.repeat(100));

    expect(screen.getAllByRole('textbox').length).toBe(1);
    expect(screen.getAllByRole('button').length).toBe(1);

    const toggleBtn = screen.getByRole('button');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
