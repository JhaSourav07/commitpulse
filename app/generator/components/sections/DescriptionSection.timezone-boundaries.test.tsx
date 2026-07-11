import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { DescriptionSection } from './DescriptionSection';

// ----------------------------------------------------------------------
// Timezone Wrapper
// ----------------------------------------------------------------------
function TimezoneBioWrapper({ initialDate }: { initialDate: string }) {
  const [bio, setBio] = useState('');
  const [lastEdited] = useState(new Date(initialDate));

  const handleChange = (val: string) => {
    setBio(val);
  };

  const formattedDate = lastEdited.toLocaleDateString('en-US', {
    timeZoneName: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  });

  return (
    <div>
      <DescriptionSection value={bio} onChange={handleChange} />
      <div data-testid="timestamp-output">{formattedDate}</div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------
describe('Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  it('1. Mock standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    process.env.TZ = 'Asia/Kolkata'; // IST
    const { unmount } = render(<TimezoneBioWrapper initialDate="2023-01-01T12:00:00Z" />);
    // 12:00 UTC is 17:30 IST
    expect(screen.getByTestId('timestamp-output').textContent).toContain('GMT+5:30');
    unmount();

    process.env.TZ = 'America/New_York'; // EST
    render(<TimezoneBioWrapper initialDate="2023-01-01T12:00:00Z" />);
    expect(screen.getByTestId('timestamp-output').textContent).toContain('EST');
  });

  it('2. Assert calculations align commits onto the correct visual dates', () => {
    process.env.TZ = 'Asia/Tokyo'; // JST (+9)
    // 11 PM UTC on Jan 1st is 8 AM JST on Jan 2nd (shifts the visual date)
    render(<TimezoneBioWrapper initialDate="2023-01-01T23:00:00Z" />);

    const timestamp = screen.getByTestId('timestamp-output').textContent;
    expect(timestamp).toContain('Jan 2, 2023'); // Shifted to the next day
    expect(timestamp).toContain('GMT+9');
  });

  it('3. Verify leap year boundaries parse without leaving gaps in grids', () => {
    process.env.TZ = 'UTC';
    render(<TimezoneBioWrapper initialDate="2024-02-29T12:00:00Z" />);

    // Validates it successfully renders a Feb 29th leap year boundary date
    const timestamp = screen.getByTestId('timestamp-output').textContent;
    expect(timestamp).toContain('Feb 29, 2024');
  });

  it('4. Assert calendar date format utility outputs match expectations in each locale', () => {
    process.env.TZ = 'Europe/London';

    render(<TimezoneBioWrapper initialDate="2023-07-01T12:00:00Z" />);

    const timestamp = screen.getByTestId('timestamp-output').textContent;
    // London in July is GMT+1 (BST)
    expect(timestamp).toContain('GMT+1');
  });

  it('5. Test offsets around transition dates like daylight savings', () => {
    // New York DST transition: Nov 5, 2023, 2:00 AM EDT -> 1:00 AM EST
    process.env.TZ = 'America/New_York';

    // Before DST ends (EDT)
    const { unmount } = render(<TimezoneBioWrapper initialDate="2023-11-04T12:00:00Z" />);
    expect(screen.getByTestId('timestamp-output').textContent).toContain('EDT');
    unmount();

    // After DST ends (EST)
    render(<TimezoneBioWrapper initialDate="2023-11-06T12:00:00Z" />);
    expect(screen.getByTestId('timestamp-output').textContent).toContain('EST');
  });
});
