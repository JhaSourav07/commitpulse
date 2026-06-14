import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import type { DeltaFormat, Language, Timezone, ViewMode } from '../types';

const createProps = () => ({
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default' as ViewMode,
  deltaFormat: 'percent' as DeltaFormat,
  badgeWidth: 1200,
  badgeHeight: 800,
  grace: 7,
  language: 'en' as Language,
  timezone: 'UTC' as Timezone,

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
});

describe('AdvancedSettingsPanel - Massive Data Sets & Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully with maximum supported dimension values', () => {
    render(<AdvancedSettingsPanel {...createProps()} />);

    expect(screen.getByLabelText(/width/i)).toHaveValue(1200);
    expect(screen.getByLabelText(/height/i)).toHaveValue(800);
    expect(screen.getByLabelText(/grace days/i)).toBeInTheDocument();
  });

  it('handles repeated width updates across large value ranges', () => {
    const props = createProps();

    render(<AdvancedSettingsPanel {...props} />);

    const widthInput = screen.getByLabelText(/width/i);

    for (let width = 100; width <= 1200; width += 100) {
      fireEvent.change(widthInput, {
        target: { value: String(width) },
      });
    }

    expect(props.onBadgeWidthChange).toHaveBeenCalled();

    const lastWidth = props.onBadgeWidthChange.mock.lastCall?.[0];

    expect(lastWidth).toBeGreaterThanOrEqual(100);
    expect(lastWidth).toBeLessThanOrEqual(1200);
  });

  it('handles repeated height updates across extreme bounds', () => {
    const props = createProps();

    render(<AdvancedSettingsPanel {...props} />);

    const heightInput = screen.getByLabelText(/height/i);

    for (let height = 80; height <= 800; height += 80) {
      fireEvent.change(heightInput, {
        target: { value: String(height) },
      });
    }

    expect(props.onBadgeHeightChange).toHaveBeenCalled();

    const lastHeight = props.onBadgeHeightChange.mock.lastCall?.[0];

    expect(lastHeight).toBeGreaterThanOrEqual(80);
    expect(lastHeight).toBeLessThanOrEqual(800);
  });

  it('processes rapid grace slider updates across the full supported range', () => {
    const props = createProps();

    render(<AdvancedSettingsPanel {...props} />);

    const slider = screen.getByLabelText(/grace days/i);

    for (let grace = 0; grace <= 7; grace++) {
      fireEvent.change(slider, {
        target: { value: String(grace) },
      });
    }

    expect(props.onGraceChange).toHaveBeenCalled();

    const lastGrace = props.onGraceChange.mock.lastCall?.[0];

    expect(lastGrace).toBeGreaterThanOrEqual(0);
    expect(lastGrace).toBeLessThanOrEqual(7);
  });

  it('remains stable during high-volume mixed control interactions', () => {
    const props = createProps();

    render(<AdvancedSettingsPanel {...props} />);

    const widthInput = screen.getByLabelText(/width/i);
    const heightInput = screen.getByLabelText(/height/i);
    const slider = screen.getByLabelText(/grace days/i);

    for (let i = 0; i < 50; i++) {
      fireEvent.change(widthInput, {
        target: { value: String(800 + (i % 400)) },
      });

      fireEvent.change(heightInput, {
        target: { value: String(600 + (i % 200)) },
      });

      fireEvent.change(slider, {
        target: { value: String(i % 8) },
      });
    }

    expect(props.onBadgeWidthChange).toHaveBeenCalled();
    expect(props.onBadgeHeightChange).toHaveBeenCalled();
    expect(props.onGraceChange).toHaveBeenCalled();

    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grace days/i)).toBeInTheDocument();
  });
});
