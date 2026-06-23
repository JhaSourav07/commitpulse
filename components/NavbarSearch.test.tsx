import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NavbarSearch from './NavbarSearch';

vi.mock('lucide-react', () => ({
  Search: () => <div>SearchIcon</div>,
  X: () => <div>CloseIcon</div>,
  ArrowRight: () => <div>ArrowRightIcon</div>,
}));

describe('NavbarSearch (desktop)', () => {
  it('renders a search trigger button', () => {
    render(<NavbarSearch />);
    expect(screen.getByLabelText('Search domains')).toBeTruthy();
  });

  it('expands and shows results when typing a matching query', async () => {
    render(<NavbarSearch />);
    const trigger = screen.getByLabelText('Search domains');
    fireEvent.click(trigger);

    const input = screen.getByLabelText(/search domains, tools, and pages/i);
    fireEvent.change(input, { target: { value: 'compare' } });

    await waitFor(() => {
      expect(screen.getByText('Compare')).toBeTruthy();
    });
  });

  it('shows "no results" state for nonsense queries', async () => {
    render(<NavbarSearch />);
    fireEvent.click(screen.getByLabelText('Search domains'));
    const input = screen.getByLabelText(/search domains, tools, and pages/i);
    fireEvent.change(input, { target: { value: 'zzzznotfound' } });

    await waitFor(() => {
      expect(screen.getByText(/no domains found/i)).toBeTruthy();
    });
  });

  it('clears query when clear button is clicked', async () => {
    render(<NavbarSearch />);
    fireEvent.click(screen.getByLabelText('Search domains'));
    const input = screen.getByLabelText(/search domains, tools, and pages/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'generator' } });

    await waitFor(() => expect(screen.getByText('Generator')).toBeTruthy());

    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(input.value).toBe('');
  });

  it('navigates via Enter key on the top result', async () => {
    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign: assignMock },
      writable: true,
    });

    render(<NavbarSearch />);
    fireEvent.click(screen.getByLabelText('Search domains'));
    const input = screen.getByLabelText(/search domains, tools, and pages/i);
    fireEvent.change(input, { target: { value: 'generator' } });

    await waitFor(() => expect(screen.getByText('Generator')).toBeTruthy());

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(assignMock).toHaveBeenCalledWith('/generator');
  });

  it('closes on Escape key', async () => {
    render(<NavbarSearch />);
    fireEvent.click(screen.getByLabelText('Search domains'));
    const input = screen.getByLabelText(/search domains, tools, and pages/i);
    fireEvent.change(input, { target: { value: 'compare' } });
    await waitFor(() => expect(screen.getByText('Compare')).toBeTruthy());

    fireEvent.keyDown(input, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('Compare')).toBeNull();
    });
  });
});

describe('NavbarSearch (mobile)', () => {
  it('renders an always-visible input', () => {
    render(<NavbarSearch variant="mobile" />);
    expect(screen.getByLabelText(/search domains, tools, and pages/i)).toBeTruthy();
  });

  it('calls onNavigate after selecting a result', async () => {
    const onNavigate = vi.fn();
    render(<NavbarSearch variant="mobile" onNavigate={onNavigate} />);
    const input = screen.getByLabelText(/search domains, tools, and pages/i);
    fireEvent.change(input, { target: { value: 'contributors' } });

    await waitFor(() => expect(screen.getByText('Contributors')).toBeTruthy());
    fireEvent.click(screen.getByText('Contributors'));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
