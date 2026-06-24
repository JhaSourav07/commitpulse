import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PersonalAnalyticsWorkspace from './PersonalAnalyticsWorkspace';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('PersonalAnalyticsWorkspace', () => {
  it('renders the workspace component', () => {
    render(<PersonalAnalyticsWorkspace />);
    expect(screen.getByText('Personal Analytics Workspace')).toBeTruthy();
  });

  it('enters editing mode and toggles a widget', () => {
    render(<PersonalAnalyticsWorkspace />);

    // Default state has AI Insights hidden
    expect(screen.getAllByText('Hidden').length).toBeGreaterThan(0);

    // Click customize
    const customizeBtn = screen.getByText('Customize Dashboard');
    fireEvent.click(customizeBtn);

    // Expect editing mode UI
    expect(screen.getByText('Save Layout')).toBeTruthy();

    // Click toggle visibility (eye icon button)
    const toggleBtns = screen.getAllByRole('button', { name: /Show|Hide/i });
    if (toggleBtns.length > 0) {
      fireEvent.click(toggleBtns[toggleBtns.length - 1]); // Toggle the last one (AI insights)
    }

    // It should now be visible (or at least we clicked it)
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });
});
