import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportPanel } from './ExportPanel';

vi.mock('../utils', () => ({
  getPlaceholderSnippet: vi.fn((format: string) => `placeholder-${format}`),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.defaultValue ? String(options.defaultValue) : key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
  Check: () => <svg data-testid="check-icon" />,
}));

const defaultProps = {
  format: 'markdown' as const,
  snippet: '[badge](https://example.com/badge.svg)',
  copied: false,
  copyStatusMessage: '',
  hasUsername: true,
  username: 'testuser',
  onFormatChange: vi.fn(),
  onCopy: vi.fn(),
};

describe('ExportPanel Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders safely when username is empty and username-dependent features are unavailable', () => {
    render(<ExportPanel {...defaultProps} username="" hasUsername={false} />);

    expect(screen.getByLabelText(/export format/i)).toBeInTheDocument();
  });

  it('falls back to placeholder snippet when username is unavailable and snippet is empty', () => {
    render(<ExportPanel {...defaultProps} username="" hasUsername={false} snippet="" />);

    expect(screen.getByText('placeholder-markdown')).toBeInTheDocument();
  });

  it('keeps copy action disabled when username is missing', () => {
    render(<ExportPanel {...defaultProps} username="" hasUsername={false} />);

    const copyButton = screen.getByRole('button', {
      name: /copy/i,
    });

    expect(copyButton).toBeDisabled();
  });

  it('keeps SVG and PNG download controls disabled when username is missing', () => {
    render(<ExportPanel {...defaultProps} username="" hasUsername={false} />);

    const buttons = screen.getAllByRole('button');

    const disabledButtons = buttons.filter((button) => (button as HTMLButtonElement).disabled);

    expect(disabledButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('handles empty snippet and empty status message without runtime errors', async () => {
    const user = userEvent.setup();

    render(
      <ExportPanel
        {...defaultProps}
        snippet=""
        copyStatusMessage=""
        username=""
        hasUsername={false}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    const codeBlock = document.querySelector('code');

    expect(codeBlock).toBeInTheDocument();

    const markdownButton = screen.getByRole('button', {
      pressed: true,
    });

    await user.click(markdownButton);

    expect(markdownButton).toBeInTheDocument();
  });
});
