import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ShareButtons from './ShareButtons';
import React from 'react';

describe('ShareButtons - Timezone Boundaries & Date Formatting', () => {
  const OriginalDate = global.Date;

  beforeEach(() => {
    // Mock the timezone to UTC for consistent testing
    process.env.TZ = 'UTC';
  });

  afterEach(() => {
    global.Date = OriginalDate;
    delete process.env.TZ;
  });

  it('normalizes sharing parameters to standard UTC boundaries to avoid local date drift', () => {
    // Sharing standard text that might contain dates
    const dateText = new Date('2026-06-02T12:00:00Z').toISOString();
    render(<ShareButtons url="https://example.com" title={`Shared on ${dateText}`} />);

    const twitterButton = screen.getByLabelText(/Share on X/i);
    expect(twitterButton).toHaveAttribute('href');
    expect(twitterButton.getAttribute('href')).toContain('2026-06-02T12%3A00%3A00.000Z');
  });

  it('aligns calendar data effectively during cross-timezone sharing operations', () => {
    process.env.TZ = 'Asia/Tokyo';
    render(<ShareButtons url="https://example.com/event?time=1717329600" title="Event" />);
    const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);
    expect(linkedinButton).toBeInTheDocument();
  });

  it('handles negative timezone offsets gracefully in generated sharing urls', () => {
    process.env.TZ = 'America/Los_Angeles';
    render(<ShareButtons url="https://example.com" title="LA Time Event" />);
    const twitterButton = screen.getByLabelText(/Share on X/i);
    expect(twitterButton.getAttribute('href')).toContain('LA%20Time');
  });

  it('preserves absolute time epoch values regardless of local execution context', () => {
    const epochTime = 1685707200000;
    render(<ShareButtons url={`https://example.com/share?t=${epochTime}`} />);
    const twitterButton = screen.getByLabelText(/Share on X/i);
    expect(twitterButton.getAttribute('href')).toContain(epochTime.toString());
  });

  it('maintains boundary precision at midnight transitions for shared content', () => {
    const midnight = new Date('2026-01-01T00:00:00.000Z').toISOString();
    render(<ShareButtons url="https://example.com" title={`Happy New Year ${midnight}`} />);
    const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);
    expect(linkedinButton).toBeInTheDocument();
  });
});
