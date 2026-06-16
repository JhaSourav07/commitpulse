import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AIInsightsSkeleton from './AIInsightsSkeleton';

describe('AIInsightsSkeleton Empty Fallback Verification', () => {
  it('1. Render the target module or component with empty arrays or null parameters', () => {
    // The skeleton itself serves as the fallback/empty state rendering
    const { container } = render(<AIInsightsSkeleton />);
    expect(container).toBeDefined();
  });

  it('2. Verify that a clear, non-breaking fallback UI or error message is displayed', () => {
    const { container } = render(<AIInsightsSkeleton />);
    // Verify it securely renders 3 separate insight fallback rows
    const rows = container.querySelectorAll('.flex-col > .flex.items-start');
    expect(rows.length).toBe(3);
  });

  it('3. Verify standard styles are maintained in this default empty layout state', () => {
    const { container } = render(<AIInsightsSkeleton />);
    const mainContainer = container.firstChild as HTMLElement;
    // Check structural styles are safely maintained
    expect(mainContainer.className).toContain('p-6');
    expect(mainContainer.className).toContain('rounded-xl');
    expect(mainContainer.className).toContain('bg-[#0a0a0a]');
  });

  it('4. Assert that no unexpected runtime errors or hydration failures occur', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Render the skeleton to ensure no exceptions are thrown
    expect(() => render(<AIInsightsSkeleton />)).not.toThrow();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('5. Check key DOM structures to make sure empty markers exist', () => {
    const { container } = render(<AIInsightsSkeleton />);
    // Verify the distinct "shimmer" markers are present in the DOM
    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
    // Header text empty marker specifically
    const headerText = container.querySelector('.w-24.h-4.shimmer.rounded');
    expect(headerText).not.toBeNull();
  });
});
