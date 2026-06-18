import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';

vi.mock('./ThemeSelector', () => ({
  StyledSelect: ({
    children,
    id,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    id?: string;
    'aria-label'?: string;
  }) => (
    <select id={id} aria-label={ariaLabel}>
      {children}
    </select>
  ),
}));

describe('AdvancedSettingsPanel Empty / Missing Inputs', () => {
  const mockHandlers = {
    onHideTitleChange: vi.fn(),
    onHideBackgroundChange: vi.fn(),
    onHideStatsChange: vi.fn(),
    onViewModeChange: vi.fn(),
    onDeltaFormatChange: vi.fn(),
    onBadgeWidthChange: vi.fn(),
    onBadgeHeightChange: vi.fn(),
    onGraceChange: vi.fn(),
    onLanguageChange: vi.fn(),
    onTimezoneChange: vi.fn(),
  };

  it('handles empty string badgeWidth without error', () => {
    render(
      <AdvancedSettingsPanel
        hideTitle={false}
        hideBackground={false}
        hideStats={false}
        viewMode="default"
        deltaFormat="absolute"
        badgeWidth=""
        badgeHeight={200}
        grace={3}
        language="en"
        timezone="UTC"
        {...mockHandlers}
      />
    );
    const inputs = screen.getAllByPlaceholderText('Auto');
    expect(inputs[0]).toHaveValue(null);
  });

  it('handles empty string badgeHeight without error', () => {
    render(
      <AdvancedSettingsPanel
        hideTitle={false}
        hideBackground={false}
        hideStats={false}
        viewMode="default"
        deltaFormat="absolute"
        badgeWidth={180}
        badgeHeight=""
        grace={3}
        language="en"
        timezone="UTC"
        {...mockHandlers}
      />
    );
    const inputs = screen.getAllByPlaceholderText('Auto');
    expect(inputs[1]).toHaveValue(null);
  });

  it('handles zero grace days correctly', () => {
    render(
      <AdvancedSettingsPanel
        hideTitle={false}
        hideBackground={false}
        hideStats={false}
        viewMode="default"
        deltaFormat="absolute"
        badgeWidth={180}
        badgeHeight={200}
        grace={0}
        language="en"
        timezone="UTC"
        {...mockHandlers}
      />
    );
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('0');
  });

  it('renders all form controls with correct labels', () => {
    render(
      <AdvancedSettingsPanel
        hideTitle={false}
        hideBackground={false}
        hideStats={false}
        viewMode="default"
        deltaFormat="absolute"
        badgeWidth={180}
        badgeHeight={200}
        grace={3}
        language="en"
        timezone="UTC"
        {...mockHandlers}
      />
    );
    expect(screen.getByLabelText(/hide title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hide background/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hide stats/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/view layout/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delta format/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
  });

  it('handles minimum badge dimensions correctly', () => {
    render(
      <AdvancedSettingsPanel
        hideTitle={false}
        hideBackground={false}
        hideStats={false}
        viewMode="default"
        deltaFormat="absolute"
        badgeWidth={100}
        badgeHeight={80}
        grace={3}
        language="en"
        timezone="UTC"
        {...mockHandlers}
      />
    );
    const inputs = screen.getAllByPlaceholderText('Auto');
    expect(inputs).toHaveLength(2);
  });
});
