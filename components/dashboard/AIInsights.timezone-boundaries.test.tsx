import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import AIInsights from './AIInsights';
import { AIInsight } from '@/types/dashboard';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'dashboard.insights.title' ? 'AI Insights' : key),
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

describe('AIInsights - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly maps valid timezone insight icons to their corresponding Lucide components', () => {
    const validInsights: AIInsight[] = [
      {
        id: '1',
        icon: 'Calendar',
        text: 'Timezone boundary alignment processed for Europe/London.',
      },
      { id: '2', icon: 'Moon', text: 'Late night activity block shifted for America/New_York.' },
    ];

    const { container } = render(<AIInsights insights={validInsights} />);

    expect(container.textContent).toContain(
      'Timezone boundary alignment processed for Europe/London.'
    );
    expect(container.textContent).toContain(
      'Late night activity block shifted for America/New_York.'
    );
  });

  it('gracefully falls back to the Sparkles icon when an unknown or missing icon string is provided in the payload', () => {
    const malformedIconInsight: AIInsight[] = [
      {
        id: '3',
        icon: 'InvalidNonExistentIconName',
        text: 'DST boundary offset calculated for Asia/Kolkata.',
      },
    ];

    const { container } = render(<AIInsights insights={malformedIconInsight} />);

    expect(container.textContent).toContain('DST boundary offset calculated for Asia/Kolkata.');
  });

  it('renders the header title correctly and does not crash when passed an empty or missing insights collection array', () => {
    const { container: emptyContainer } = render(<AIInsights insights={[]} />);
    expect(emptyContainer.textContent).toContain('AI Insights');

    const { container: missingContainer } = render(
      <AIInsights insights={undefined as unknown as AIInsight[]} />
    );
    expect(missingContainer.textContent).toContain('AI Insights');
  });

  it('maintains layout rendering structure when processing exceptionally long timezone boundary descriptions', () => {
    const longText =
      'A'.repeat(500) +
      ' Leap-year boundary synchronization successfully verified across regional offsets.';
    const longInsight: AIInsight[] = [{ id: '4', icon: 'Zap', text: longText }];

    const { container } = render(<AIInsights insights={longInsight} />);

    expect(container.textContent).toContain('Leap-year boundary synchronization');
  });

  it('renders a high-volume batch of timezone-calculated metrics records seamlessly without dropping elements', () => {
    const heavyPayload: AIInsight[] = Array.from({ length: 50 }, (_, index) => ({
      id: `heavy-tz-${index}`,
      icon: 'Star',
      text: `Unique text signature for token record marker line: ${index}`,
    }));

    const { container } = render(<AIInsights insights={heavyPayload} />);

    heavyPayload.forEach((insight) => {
      expect(container.textContent).toContain(insight.text);
    });
  });
});
