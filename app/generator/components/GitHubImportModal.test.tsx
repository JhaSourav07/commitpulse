import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubImportModal } from './GitHubImportModal';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  Loader2: () => <div data-testid="icon-loader2" />,
  AlertCircle: () => <div data-testid="icon-alertcircle" />,
  CheckCircle2: () => <div data-testid="icon-checkcircle2" />,
}));

// Mock the mapper so we don't need real mapped values
vi.mock('../utils/githubMapper', () => ({
  mapGitHubData: vi.fn().mockReturnValue({
    name: 'Mocked Name',
    description: 'Mocked Bio',
    selectedTechs: ['react'],
    selectedSocials: ['github'],
    socialLinks: { github: 'https://github.com/mock' },
  }),
}));

describe('GitHubImportModal', () => {
  const onApply = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders correctly when open', () => {
    render(<GitHubImportModal isOpen={true} onClose={onClose} onApply={onApply} />);
    expect(screen.getByText('Import from GitHub')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('GitHub Username')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <GitHubImportModal isOpen={false} onClose={onClose} onApply={onApply} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows error on 404', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<GitHubImportModal isOpen={true} onClose={onClose} onApply={onApply} />);

    const input = screen.getByPlaceholderText('GitHub Username');
    fireEvent.change(input, { target: { value: 'notfounduser' } });

    const importBtn = screen.getByText('Import Profile');
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByText('GitHub user not found')).toBeInTheDocument();
    });
  });

  it('shows error on rate limit', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    render(<GitHubImportModal isOpen={true} onClose={onClose} onApply={onApply} />);

    const input = screen.getByPlaceholderText('GitHub Username');
    fireEvent.change(input, { target: { value: 'ratelimiteduser' } });

    const importBtn = screen.getByText('Import Profile');
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded. Please try again later.')).toBeInTheDocument();
    });
  });

  it('fetches data and shows review screen on success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ login: 'testuser' }) }) // user
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // repos
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // socials

    render(<GitHubImportModal isOpen={true} onClose={onClose} onApply={onApply} />);

    const input = screen.getByPlaceholderText('GitHub Username');
    fireEvent.change(input, { target: { value: 'testuser' } });

    const importBtn = screen.getByText('Import Profile');
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Successfully fetched profile data! Review the imported fields below.')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Mocked Name')).toBeInTheDocument();

    const applyBtn = screen.getByText('Apply Selected');
    fireEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalledWith({
      name: 'Mocked Name',
      description: 'Mocked Bio',
      selectedTechs: ['react'],
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/mock' },
    });
    expect(onClose).toHaveBeenCalled();
  });
});
