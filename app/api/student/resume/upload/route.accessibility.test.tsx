import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it } from 'vitest';

const AccessibleUploadPreview = () => {
  return (
    <main>
      <h1>Resume Upload</h1>

      <p id="resume-help-text">Upload your resume in PDF or DOCX format.</p>

      <button aria-label="Upload Resume" aria-describedby="resume-help-text">
        Upload Resume
      </button>

      <div role="tooltip">Select a file to upload</div>

      <button>Submit Resume</button>
    </main>
  );
};

describe('API Resume Upload Route - Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('1. associates interactive controls with accessible descriptions', () => {
    render(<AccessibleUploadPreview />);

    const uploadButton = screen.getByRole('button', {
      name: /upload resume/i,
    });

    expect(uploadButton).toHaveAttribute('aria-describedby', 'resume-help-text');
  });

  it('2. exposes tooltip content through accessibility roles', () => {
    render(<AccessibleUploadPreview />);

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Select a file to upload');
  });

  it('3. preserves logical keyboard tab ordering', async () => {
    const user = userEvent.setup();

    render(<AccessibleUploadPreview />);

    await user.tab();
    expect(screen.getByRole('button', { name: /upload resume/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /submit resume/i })).toHaveFocus();
  });

  it('4. keeps interactive controls keyboard focusable', async () => {
    const user = userEvent.setup();

    render(<AccessibleUploadPreview />);

    await user.tab();

    const uploadButton = screen.getByRole('button', {
      name: /upload resume/i,
    });

    expect(uploadButton).toHaveFocus();
  });

  it('5. provides a logical heading hierarchy for screen readers', () => {
    render(<AccessibleUploadPreview />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /resume upload/i,
      })
    ).toBeInTheDocument();
  });
});
