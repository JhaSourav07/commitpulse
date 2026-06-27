import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardLayout from './layout';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe('DashboardLayout Accessibility', () => {
  it('renders the main landmark element', () => {
    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children inside the main landmark', () => {
    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('contains exactly one main landmark', () => {
    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('renders the toaster component for accessible notifications', () => {
    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('keeps the main landmark available for screen readers', () => {
    render(
      <DashboardLayout>
        <button>Focusable Button</button>
      </DashboardLayout>
    );

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('button', { name: 'Focusable Button' })
    );
  });
});
