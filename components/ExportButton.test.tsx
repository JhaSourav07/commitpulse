import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExportButton from './ExportButton';
import { useExportImage } from '@/hooks/useExportImage';

vi.mock('@/hooks/useExportImage', () => ({
  useExportImage: vi.fn(),
}));

const mockedUseExportImage = vi.mocked(useExportImage);

describe('ExportButton', () => {
  const exportImage = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    exportImage.mockResolvedValue(undefined);
    mockedUseExportImage.mockReturnValue({
      exportImage,
      isExporting: false,
      error: null,
    });
  });

  it('renders the default "Export" trigger button, closed and not loading', () => {
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).not.toBeDisabled();
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('passes the provided targetSelector, filename, and scale through to the hook', () => {
    render(<ExportButton targetSelector="#card" filename="my-export" scale={3} />);

    expect(mockedUseExportImage).toHaveBeenCalledWith({
      targetSelector: '#card',
      filename: 'my-export',
      scale: 3,
    });
  });

  it('falls back to the documented defaults when no props are given', () => {
    render(<ExportButton />);

    expect(mockedUseExportImage).toHaveBeenCalledWith({
      targetSelector: '[data-export-target]',
      filename: 'commitpulse-comparison',
      scale: 2,
    });
  });

  it('appends a custom className to the wrapper while keeping the base layout classes', () => {
    const { container } = render(<ExportButton className="my-custom-class" />);
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain('relative inline-block');
    expect(wrapper.className).toContain('my-custom-class');
  });

  it('opens the format menu on click and exposes both download options', () => {
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByRole('button', { name: /export/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /download png/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /download svg/i })).toBeInTheDocument();
  });

  it('toggles the menu closed when the trigger is clicked a second time', () => {
    render(<ExportButton />);
    const trigger = screen.getByRole('button', { name: /export/i });

    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu when clicking the backdrop overlay outside of it', () => {
    const { container } = render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const backdrop = container.querySelector('.fixed.inset-0') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls exportImage with "png" and closes the menu when "Download PNG" is clicked', async () => {
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /download png/i }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(exportImage).toHaveBeenCalledTimes(1);
    expect(exportImage).toHaveBeenCalledWith('png');
  });

  it('calls exportImage with "svg" and closes the menu when "Download SVG" is clicked', async () => {
    render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /download svg/i }));

    expect(exportImage).toHaveBeenCalledTimes(1);
    expect(exportImage).toHaveBeenCalledWith('svg');
  });

  it('shows the "Exporting…" loading state and disables the trigger while exporting', () => {
    mockedUseExportImage.mockReturnValue({
      exportImage,
      isExporting: true,
      error: null,
    });

    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /exporting/i });
    expect(trigger).toBeDisabled();
    expect(screen.queryByText(/^export$/i)).not.toBeInTheDocument();
  });

  it('does not render the dropdown menu while isExporting is true, even if previously opened', () => {
    const { rerender } = render(<ExportButton />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    mockedUseExportImage.mockReturnValue({
      exportImage,
      isExporting: true,
      error: null,
    });
    rerender(<ExportButton />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders an alert with the error message when the hook reports an error', () => {
    mockedUseExportImage.mockReturnValue({
      exportImage,
      isExporting: false,
      error: 'Export failed. Please try again.',
    });

    render(<ExportButton />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Export failed. Please try again.');
  });

  it('does not render an alert when there is no error', () => {
    render(<ExportButton />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
