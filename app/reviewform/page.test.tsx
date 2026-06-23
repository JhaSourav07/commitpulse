import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import ReviewFormPage from './page';

describe('ReviewFormPage', () => {
  it('renders the testimonial submission form', () => {
    render(<ReviewFormPage />);

    expect(
      screen.getByRole('heading', {
        name: /share your experience/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/platform & handle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your testimonial/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit testimonial/i })).toBeInTheDocument();
  });
});
