import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdvancedColorPicker from './AdvancedColorPicker';
import { getContrastRatio } from '@/utils/color';

const PRESETS = [
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#8b5cf6', label: 'Purple' },
  { hex: '#f43f5e', label: 'Rose' },
];

function renderPicker(props: Partial<React.ComponentProps<typeof AdvancedColorPicker>> = {}) {
  const onChange = vi.fn();
  const result = render(
    <AdvancedColorPicker value="#10b981" onChange={onChange} presets={PRESETS} {...props} />
  );
  return { onChange, ...result };
}

function renderInCustom(value: string, onChange = vi.fn()) {
  render(<AdvancedColorPicker value={value} onChange={onChange} presets={PRESETS} />);
  fireEvent.click(screen.getByRole('button', { name: /custom/i }));
}

describe('AdvancedColorPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tab switching', () => {
    it('renders Presets tab as active by default when presets are provided', () => {
      renderPicker();
      const presetsTab = screen.getByRole('button', { name: /presets/i });
      expect(presetsTab).toBeTruthy();
      expect(presetsTab.className).toContain('bg-zinc-700');
    });

    it('renders Custom tab as active by default when no presets are provided', () => {
      render(<AdvancedColorPicker value="#10b981" onChange={vi.fn()} />);
      const customTab = screen.getByRole('button', { name: /custom/i });
      expect(customTab.className).toContain('bg-zinc-700');
    });

    it('switches to Custom tab when clicked', () => {
      renderPicker();
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      const hexInput = document.querySelector('input[type="text"]');
      expect(hexInput).toBeTruthy();
    });

    it('switches back to Presets tab when clicked', () => {
      renderPicker();
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      fireEvent.click(screen.getByRole('button', { name: /presets/i }));
      expect(screen.getByTitle('Emerald')).toBeTruthy();
      expect(screen.getByTitle('Purple')).toBeTruthy();
      expect(screen.getByTitle('Rose')).toBeTruthy();
    });
  });

  describe('presets', () => {
    it('renders all preset color buttons', () => {
      renderPicker();
      PRESETS.forEach(({ label }) => {
        expect(screen.getByTitle(label)).toBeTruthy();
      });
    });

    it('calls onChange with the preset hex on click', () => {
      const { onChange } = renderPicker({ value: '#10b981' });
      fireEvent.click(screen.getByTitle('Purple'));
      expect(onChange).toHaveBeenCalledWith('#8b5cf6');
    });

    it('applies ring style to the selected preset', () => {
      renderPicker({ value: '#8b5cf6' });
      const purpleBtn = screen.getByTitle('Purple');
      expect(purpleBtn.className).toContain('ring-2');
    });
  });

  describe('custom tab', () => {
    it('renders the hex input showing the current value without #', () => {
      renderInCustom('#10b981');
      const hexInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      expect(hexInput).toBeTruthy();
      expect(hexInput.value).toBe('10b981');
    });

    it('renders hue and spectrum canvases', () => {
      renderInCustom('#10b981');
      const canvases = document.querySelectorAll('canvas');
      expect(canvases.length).toBe(2);
    });

    it('renders R, G, B input fields with correct values', () => {
      renderInCustom('#10b981');
      const numberInputs = document.querySelectorAll('input[type="number"]');
      expect(numberInputs.length).toBe(3);
      expect((numberInputs[0] as HTMLInputElement).value).toBe('16');
      expect((numberInputs[1] as HTMLInputElement).value).toBe('185');
      expect((numberInputs[2] as HTMLInputElement).value).toBe('129');
    });

    it('renders the eyedropper picker button', () => {
      renderInCustom('#10b981');
      const pickerBtn = screen.getByTitle('Pick color from page');
      expect(pickerBtn).toBeTruthy();
    });

    it('renders the color preview swatch', () => {
      renderInCustom('#10b981');
      const swatches = document.querySelectorAll('[style*="background-color: rgb(16, 185, 129)"]');
      expect(swatches.length).toBeGreaterThan(0);
    });

    it('renders contrast ratio information', () => {
      renderInCustom('#10b981');
      expect(screen.getAllByText(/contrast/i).length).toBeGreaterThanOrEqual(1);
    });

    it('calls onChange when hex input receives a valid 6-digit value', () => {
      const onChange = vi.fn();
      render(<AdvancedColorPicker value="#10b981" onChange={onChange} presets={PRESETS} />);
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      const hexInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      fireEvent.change(hexInput, { target: { value: 'ff6600' } });
      expect(onChange).toHaveBeenCalledWith('#ff6600');
    });

    it('does not call onChange for incomplete hex input', () => {
      const onChange = vi.fn();
      render(<AdvancedColorPicker value="#10b981" onChange={onChange} presets={PRESETS} />);
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      const hexInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      fireEvent.change(hexInput, { target: { value: 'ff' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange for invalid hex characters', () => {
      const onChange = vi.fn();
      render(<AdvancedColorPicker value="#10b981" onChange={onChange} presets={PRESETS} />);
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      const hexInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      fireEvent.change(hexInput, { target: { value: 'zzzzzz' } });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility validation', () => {
    it('shows Fix contrast button when color has poor contrast on white', () => {
      renderInCustom('#ff0000');
      const fixBtn = screen.queryByText(/fix contrast/i);
      expect(fixBtn).toBeTruthy();
    });

    it('does not show Fix contrast button when color passes AA on white', () => {
      renderInCustom('#000000');
      const fixBtn = screen.queryByText(/fix contrast/i);
      expect(fixBtn).toBeNull();
    });

    it('Fix contrast button calls onChange with an accessible alternative', () => {
      const onChange = vi.fn();
      render(<AdvancedColorPicker value="#ff0000" onChange={onChange} presets={PRESETS} />);
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      fireEvent.click(screen.getByText(/fix contrast/i));
      expect(onChange).toHaveBeenCalled();
      const newColor = onChange.mock.calls[0][0] as string;
      expect(getContrastRatio(newColor, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('color value updates', () => {
    it('changes hex input when value prop changes externally', () => {
      const { rerender } = render(
        <AdvancedColorPicker value="#10b981" onChange={vi.fn()} presets={PRESETS} />
      );
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      rerender(<AdvancedColorPicker value="#ff6600" onChange={vi.fn()} presets={PRESETS} />);
      const hexInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      expect(hexInput.value).toBe('ff6600');
    });

    it('updates RGB inputs when value prop changes', () => {
      const { rerender } = render(
        <AdvancedColorPicker value="#10b981" onChange={vi.fn()} presets={PRESETS} />
      );
      fireEvent.click(screen.getByRole('button', { name: /custom/i }));
      rerender(<AdvancedColorPicker value="#ff0000" onChange={vi.fn()} presets={PRESETS} />);
      const numberInputs = document.querySelectorAll('input[type="number"]');
      expect((numberInputs[0] as HTMLInputElement).value).toBe('255');
      expect((numberInputs[1] as HTMLInputElement).value).toBe('0');
      expect((numberInputs[2] as HTMLInputElement).value).toBe('0');
    });
  });
});
