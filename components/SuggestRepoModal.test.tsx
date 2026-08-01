import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuggestRepoModal from './SuggestRepoModal';
import '@testing-library/jest-dom';

describe('SuggestRepoModal', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<SuggestRepoModal isOpen={false} onClose={onClose} onSubmit={onSubmit} />);
    expect(screen.queryByText('Suggest a Repository')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    expect(screen.getByText('Suggest a Repository')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('e.g. facebook/react or https://github.com/facebook/react')
    ).toBeInTheDocument();
  });

  it('has updated placeholder text on reason field prompting quality input', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    expect(screen.getByPlaceholderText(expectedPlaceholder)).toBeInTheDocument();
  });

  it('displays initial live character counter as "0 / 1000"', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const counter = screen.getByTestId('reason-char-counter');
    expect(counter).toHaveTextContent('0 / 1000');
  });

  it('updates live character counter output as user types', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    const testText = 'This is a great repository for open source beginners.';
    fireEvent.change(reasonInput, { target: { value: testText } });

    const counter = screen.getByTestId('reason-char-counter');
    expect(counter).toHaveTextContent(`${testText.length} / 1000`);
  });

  it('styles character counter amber when count < 50', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    // 42 characters (< 50)
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(42) } });

    const counter = screen.getByTestId('reason-char-counter');
    expect(counter.className).toContain('text-amber-600');
  });

  it('styles character counter default gray when 50 <= count < 100', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    // 60 characters (50..99)
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(60) } });

    const counter = screen.getByTestId('reason-char-counter');
    expect(counter.className).toContain('text-gray-500');
  });

  it('styles character counter green when count >= 100', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    // 105 characters (>= 100)
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(105) } });

    const counter = screen.getByTestId('reason-char-counter');
    expect(counter.className).toContain('text-emerald-500');
  });

  it('shows quality hint message when character count < 50', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const expectedHint = 'Add more detail to help reviewers approve this faster.';

    expect(screen.getByText(expectedHint)).toBeInTheDocument();

    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    // 49 characters (< 50)
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(49) } });
    expect(screen.getByText(expectedHint)).toBeInTheDocument();
  });

  it('hides quality hint message when character count >= 50', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const expectedHint = 'Add more detail to help reviewers approve this faster.';
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    // 50 characters (>= 50)
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(50) } });
    expect(screen.queryByText(expectedHint)).not.toBeInTheDocument();
  });

  it('disables submit button when reason length < 10 or repo URL is empty', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const submitBtn = screen.getByRole('button', { name: 'Submit Suggestion' });
    expect(submitBtn).toBeDisabled();

    const repoInput = screen.getByPlaceholderText(
      'e.g. facebook/react or https://github.com/facebook/react'
    );
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    // Repo URL only, reason too short (9 chars)
    fireEvent.change(repoInput, { target: { value: 'facebook/react' } });
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(9) } });
    expect(submitBtn).toBeDisabled();

    // Valid inputs (10 chars reason)
    fireEvent.change(reasonInput, { target: { value: 'a'.repeat(10) } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits form data when valid and submit button is clicked', async () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const repoInput = screen.getByPlaceholderText(
      'e.g. facebook/react or https://github.com/facebook/react'
    );
    const expectedPlaceholder =
      'Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues...';
    const reasonInput = screen.getByPlaceholderText(expectedPlaceholder);

    fireEvent.change(repoInput, { target: { value: 'owner/repo' } });
    fireEvent.change(reasonInput, {
      target: { value: 'This repository is very active and beginner friendly.' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Submit Suggestion' });
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      repoUrl: 'owner/repo',
      reason: 'This repository is very active and beginner friendly.',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button or backdrop is clicked or Escape key is pressed', () => {
    render(<SuggestRepoModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    const closeBtn = screen.getByLabelText('Close suggest repository modal');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
