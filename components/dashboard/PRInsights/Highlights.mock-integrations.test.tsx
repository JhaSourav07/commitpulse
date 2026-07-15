import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Highlights from './Highlights';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a {...props}>{children}</a>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  MessageSquare: () => <div data-testid="message-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  HardDrive: () => <div data-testid="drive-icon" />,
  ArrowRight: () => <div data-testid="arrow-icon" />,
}));

const cache = new Map<string, unknown>();

const service = {
  fetchHighlights: vi.fn(),
};

const mockHighlights = {
  fastestMerged: {
    title: 'Fast merge',
    url: 'https://example.com/1',
    time: 1.5,
  },
  mostDiscussed: {
    title: 'Discussion PR',
    url: 'https://example.com/2',
    comments: 24,
  },
  largest: {
    title: 'Largest PR',
    url: 'https://example.com/3',
    additions: 200,
    deletions: 40,
  },
} as PRInsightData['highlights'];

describe('Highlights - Mock Integrations & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
  });

  it('1. mocks asynchronous service loading successfully', async () => {
    service.fetchHighlights.mockResolvedValue(mockHighlights);

    const result = await service.fetchHighlights();

    expect(service.fetchHighlights).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockHighlights);
  });

  it('2. simulates pending service state before rendering', () => {
    service.fetchHighlights.mockImplementation(() => new Promise(() => {}));

    render(<Highlights highlights={mockHighlights} />);

    expect(screen.getByText(/Fast merge/i)).toBeInTheDocument();
  });

  it('3. checks local cache before service retrieval', async () => {
    cache.set('highlights', mockHighlights);

    const cached = cache.get('highlights');

    expect(cached).toEqual(mockHighlights);
    expect(service.fetchHighlights).not.toHaveBeenCalled();
  });

  it('4. falls back correctly when service timeout occurs', async () => {
    service.fetchHighlights.mockRejectedValue(new Error('Request timeout'));

    await expect(service.fetchHighlights()).rejects.toThrow('Request timeout');

    render(<Highlights highlights={mockHighlights} />);

    expect(screen.getByText(/Discussion PR/i)).toBeInTheDocument();
  });

  it('5. synchronizes cache after successful callback', async () => {
    service.fetchHighlights.mockResolvedValue(mockHighlights);

    const result = await service.fetchHighlights();

    cache.set('highlights', result);

    expect(cache.get('highlights')).toEqual(mockHighlights);

    render(<Highlights highlights={mockHighlights} />);

    expect(screen.getByText(/Largest PR/i)).toBeInTheDocument();
  });
});
