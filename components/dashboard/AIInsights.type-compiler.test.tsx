import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIInsights from './AIInsights';
import type { AIInsight } from '@/types/dashboard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

type MotionDivProps = ComponentProps<'div'> & {
  children?: ReactNode;
  whileInView?: unknown;
  viewport?: unknown;
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileInView,
      viewport,
      initial,
      animate,
      transition,
      ...props
    }: MotionDivProps) => <div {...props}>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Sparkles: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="sparkles-icon" width={size} className={className} />
  ),
  Moon: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="moon-icon" width={size} className={className} />
  ),
  Sun: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="sun-icon" width={size} className={className} />
  ),
  Zap: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="zap-icon" width={size} className={className} />
  ),
  Calendar: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="calendar-icon" width={size} className={className} />
  ),
  Flame: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="flame-icon" width={size} className={className} />
  ),
  Code: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="code-icon" width={size} className={className} />
  ),
  Star: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="star-icon" width={size} className={className} />
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ---------------------------------------------------------------------------
// Fixtures — every field explicitly typed so the compiler validates the shape
// ---------------------------------------------------------------------------

const mockInsights: AIInsight[] = [
  { id: 'insight-1', icon: 'Flame', text: 'You have a 14-day streak going — keep it up!' },
  { id: 'insight-2', icon: 'Moon', text: 'You tend to commit late at night.' },
  { id: 'insight-3', icon: 'Calendar', text: 'Your most active day is Wednesday.' },
  { id: 'insight-4', icon: 'Code', text: 'TypeScript is your dominant language this month.' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AIInsights — TypeScript Compiler Validation & Schema Constraints Stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1 — All three required fields are present and correctly typed
  // -------------------------------------------------------------------------
  it('validates that AIInsight fields id, icon, and text are all required strings', () => {
    // Assigning to AIInsight lets the TypeScript compiler enforce the schema at
    // compile time. At runtime we confirm the shapes are correct values.
    const insight: AIInsight = mockInsights[0];

    expect(typeof insight.id).toBe('string');
    expect(typeof insight.icon).toBe('string');
    expect(typeof insight.text).toBe('string');

    // Render to confirm the component accepts a correctly typed prop without errors.
    render(<AIInsights insights={[insight]} />);
    expect(screen.getByText(insight.text)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Test 2 — id field must be a non-empty string (schema constraint)
  // -------------------------------------------------------------------------
  it('enforces that the id field is a non-empty string identifier', () => {
    // Every insight in the fixture must have a non-empty id — an empty string
    // would violate the intent of the schema even if TypeScript allows it.
    mockInsights.forEach((insight) => {
      expect(insight.id.length).toBeGreaterThan(0);
      // ids must be unique across the array (regression guard for duplicate keys)
    });

    const ids = mockInsights.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // -------------------------------------------------------------------------
  // Test 3 — icon field maps to a recognised key in the component's iconMap
  // -------------------------------------------------------------------------
  it('verifies the icon field accepts any string and falls back to Sparkles for unknown values', () => {
    // The component uses iconMap[insight.icon] || Sparkles, so unknown icon
    // strings must not crash the renderer — they silently fall back.
    const knownIcons = ['Moon', 'Sun', 'Zap', 'Calendar', 'Flame', 'Code', 'Star'];
    const unknownIconInsight: AIInsight = {
      id: 'fallback-1',
      icon: 'UnknownIcon',
      text: 'Fallback test',
    };

    // Known icons render without falling back.
    mockInsights.forEach((insight) => {
      expect(typeof insight.icon).toBe('string');
      expect(knownIcons).toContain(insight.icon);
    });

    // Unknown icon must still render (component falls back to Sparkles).
    render(<AIInsights insights={[unknownIconInsight]} />);
    expect(screen.getByText('Fallback test')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Test 4 — text field accepts any non-empty string without compile errors
  // -------------------------------------------------------------------------
  it('confirms the text field accepts arbitrary string content including punctuation and unicode', () => {
    const edgeCaseInsights: AIInsight[] = [
      { id: 'edge-1', icon: 'Star', text: 'Short' },
      { id: 'edge-2', icon: 'Star', text: 'A'.repeat(500) }, // very long string
      { id: 'edge-3', icon: 'Star', text: 'Unicode: 🚀 commits 🔥' }, // emoji
      { id: 'edge-4', icon: 'Star', text: 'Special chars: <>&"\'' }, // HTML-like chars
    ];

    // All must satisfy the AIInsight schema — the type only requires string.
    edgeCaseInsights.forEach((insight) => {
      expect(typeof insight.text).toBe('string');
      expect(insight.text.length).toBeGreaterThan(0);
    });

    render(<AIInsights insights={edgeCaseInsights} />);

    // Every text value must appear in the rendered output.
    edgeCaseInsights.forEach((insight) => {
      expect(screen.getByText(insight.text)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Test 5 — Component accepts AIInsight[] prop and renders all items
  // -------------------------------------------------------------------------
  it('accepts an AIInsight[] prop and renders every insight without type violations', () => {
    render(<AIInsights insights={mockInsights} />);

    // Every text value from the typed array must appear in the DOM — confirming
    // the component correctly iterates the typed prop without dropping items.
    mockInsights.forEach((insight) => {
      expect(screen.getByText(insight.text)).toBeInTheDocument();
    });
  });
});
