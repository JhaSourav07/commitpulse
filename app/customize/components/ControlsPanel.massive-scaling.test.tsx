import { fireEvent, render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import type { BadgeSize, Font, Scale } from '../types';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const createProps = () => ({
  username: 'octocat',
  theme: 'dark',
  bgHex: '',
  bgType: 'solid' as 'solid' | 'linear' | 'radial',
  bgStart: '',
  bgEnd: '',
  bgAngle: 90,
  accentHex: '',
  textHex: '',
  scale: 'linear' as Scale,
  speed: 'normal',
  font: 'inter' as Font,
  year: '',
  radius: 12,
  size: 'md' as BadgeSize,
  onUsernameChange: vi.fn(),
  onThemeChange: vi.fn(),
  onBgHexChange: vi.fn(),
  onBgTypeChange: vi.fn(),
  onBgStartChange: vi.fn(),
  onBgEndChange: vi.fn(),
  onBgAngleChange: vi.fn(),
  onAccentHexChange: vi.fn(),
  onTextHexChange: vi.fn(),
  onScaleChange: vi.fn(),
  onSpeedChange: vi.fn(),
  onFontChange: vi.fn(),
  onYearChange: vi.fn(),
  onSizeChange: vi.fn(),
  onClearOverrides: vi.fn(),
  onRadiusChange: vi.fn(),
});

describe('ControlsPanel - Massive Scaling', () => {
  it('handles username input with massive character strings without breaking or crashing', () => {
    const props = createProps();
    const massiveUsername = 'a'.repeat(20000);
    props.username = massiveUsername;

    render(<ControlsPanel {...props} />);

    const usernameInput = screen.getByPlaceholderText(
      'customize.controls.username_placeholder'
    ) as HTMLInputElement;
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput.value).toBe(massiveUsername);

    const evenLargerUsername = 'b'.repeat(40000);
    fireEvent.change(usernameInput, { target: { value: evenLargerUsername } });
    expect(props.onUsernameChange).toHaveBeenCalledWith(evenLargerUsername);
  });

  it('handles extreme high bounds for border radius without crashing by clamping values to HTML range bounds', () => {
    const props = createProps();
    props.radius = 1000000; // Above default max (50)

    const { rerender } = render(<ControlsPanel {...props} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    // JSDOM range input automatically clamps the value to max attribute (50)
    expect(Number(slider.value)).toBe(50);

    props.radius = -500000; // Below default min (0)
    rerender(<ControlsPanel {...props} />);
    // JSDOM range input clamps value to min attribute (0)
    expect(Number(slider.value)).toBe(0);

    // Verify callback triggers correctly on user slider interaction
    fireEvent.change(slider, { target: { value: '25' } });
    expect(props.onRadiusChange).toHaveBeenCalledWith(25);
  });

  it('handles extreme temporal scaling by mocking system date to a far future year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(3000, 0, 1));

    const props = createProps();
    const { container } = render(<ControlsPanel {...props} />);

    const yearSelect = container.querySelector('#year-select') as HTMLSelectElement;
    expect(yearSelect).toBeInTheDocument();

    const options = yearSelect.querySelectorAll('option');
    // currentYear = 3000. options are: yearOption = currentYear - i - 1 for i in 0 .. currentYear - 2019 - 1 (inclusive)
    // Plus the option value="" for "currentYear (current)"
    // So total options is: (3000 - 2019) + 1 = 982
    expect(options.length).toBe(982);

    vi.useRealTimers();
  });

  it('handles custom HEX input controls under extreme/boundary color values without crashing', () => {
    const props = createProps();
    props.bgType = 'linear';
    props.bgStart = 'invalid-hex-start-long-string-🚀';
    props.bgEnd = '1234567890abcdef!@#';
    props.accentHex = 'emoji🌟';
    props.textHex = '123';

    const { container, rerender } = render(<ControlsPanel {...props} />);

    const bgStartInput = container.querySelector('#bg-start-hex-input') as HTMLInputElement;
    expect(bgStartInput).toBeInTheDocument();
    expect(bgStartInput.value).toBe('invalid-hex-start-long-string-🚀');

    const bgEndInput = container.querySelector('#bg-end-hex-input') as HTMLInputElement;
    expect(bgEndInput).toBeInTheDocument();
    expect(bgEndInput.value).toBe('1234567890abcdef!@#');

    const accentInput = container.querySelector('#accent-hex-input') as HTMLInputElement;
    const textInput = container.querySelector('#text-hex-input') as HTMLInputElement;
    expect(accentInput.value).toBe('emoji🌟');
    expect(textInput.value).toBe('123');

    // Accent picker fallback test due to invalid hex value. The input ID is `${id}-picker` where id is 'accent-hex-input'
    const accentPicker = container.querySelector('#accent-hex-input-picker') as HTMLInputElement;
    expect(accentPicker).toBeInTheDocument();
    expect(accentPicker.value).toBe('#000000');

    // Fire changes with extreme inputs
    fireEvent.change(accentInput, {
      target: { value: 'invalid_hex_value_with_long_length_and_symbols_$' },
    });
    expect(props.onAccentHexChange).toHaveBeenCalledWith(
      'invalid_hex_value_with_long_length_and_symbols_$'
    );

    props.bgType = 'radial';
    rerender(<ControlsPanel {...props} />);
    expect(container.querySelector('#bg-start-hex-input')).toBeInTheDocument();

    props.bgType = 'solid';
    rerender(<ControlsPanel {...props} />);
    expect(container.querySelector('#bg-hex-input')).toBeInTheDocument();
    expect(container.querySelector('#bg-start-hex-input')).toBeNull();
  });

  it('renders and processes rapid updates efficiently under load', () => {
    const props = createProps();
    const { rerender } = render(<ControlsPanel {...props} />);

    const start = performance.now();

    act(() => {
      for (let i = 0; i < 30; i++) {
        const scaleVal = i % 2 === 0 ? 'linear' : 'log';
        const radiusVal = i % 50;
        rerender(
          <ControlsPanel {...props} scale={scaleVal} radius={radiusVal} username={`user-${i}`} />
        );
      }
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
