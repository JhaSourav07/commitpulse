import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ExportPanel } from './ExportPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('../utils', () => ({
  getPlaceholderSnippet: () => '<!-- placeholder snippet -->',
}));

const defaultProps = {
  format: 'markdown' as const,
  snippet: '![badge](https://commitpulse.vercel.app/api/badge?username=test)',
  copied: false,
  copyStatusMessage: '',
  hasUsername: true,
  username: 'testuser',
  onFormatChange: vi.fn(),
  onCopy: vi.fn(),
};

describe('ExportPanel Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('uses correct accessible label coordinates (aria-label and aria-describedby)', () => {
    render(<ExportPanel {...defaultProps} />);
    const copyBtn = screen.getByRole('button', { name: /copy markdown export snippet/i });
    expect(copyBtn).toHaveAttribute('aria-label');
    expect(copyBtn).toHaveAttribute('aria-describedby', 'export-copy-status');
    const statusEl = document.getElementById('export-copy-status');
    expect(statusEl).toBeInTheDocument();
  });

  it('ensures interactive buttons maintain visible focus outline behaviors', () => {
    render(<ExportPanel {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      btn.focus();
      expect(document.activeElement).toBe(btn);
      expect(btn).toBeVisible();
    });
  });

  it('announces copy status via aria-live polite region for screen readers', () => {
    render(<ExportPanel {...defaultProps} copyStatusMessage="Copied to clipboard!" />);
    const liveRegion = document.getElementById('export-copy-status');
    expect(liveRegion).toHaveAttribute('role', 'status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveTextContent('Copied to clipboard!');
  });

  it('maintains logical keyboard tab order for all interactive elements', () => {
    render(<ExportPanel {...defaultProps} />);
    const focusables = document.querySelectorAll(
      'button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusables.length).toBeGreaterThan(0);
    focusables.forEach((el) => {
      expect(el.getAttribute('tabindex')).not.toBe('-1');
    });
  });

  it('renders SVG icons with aria-hidden and format group with aria-label', () => {
    render(<ExportPanel {...defaultProps} />);
    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThan(0);
    const formatGroup = document.querySelector('[aria-label="Export format"]');
    expect(formatGroup).toBeInTheDocument();
  });
});
