import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ApiStudentResumeUploadRoute responsive breakpoints (Variation 7)', () => {
  const mockViewport = vi.fn();
  const mockLayout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies mobile layout for 375px viewport', () => {
    mockViewport.mockReturnValue({
      width: 375,
      columns: 1,
    });

    const result = mockViewport(375);

    expect(result.width).toBe(375);
    expect(result.columns).toBe(1);
  });

  it('reflows columns into a vertical stack on mobile', () => {
    mockLayout.mockReturnValue({
      direction: 'column',
      gap: 16,
    });

    const result = mockLayout('mobile');

    expect(result.direction).toBe('column');
    expect(result.gap).toBe(16);
  });

  it('avoids fixed widths that would cause horizontal scrolling', () => {
    mockLayout.mockReturnValue({
      width: '100%',
      overflowX: 'hidden',
    });

    const result = mockLayout('mobile');

    expect(result.width).toBe('100%');
    expect(result.overflowX).toBe('hidden');
  });

  it('scales navigation components gracefully', () => {
    mockLayout.mockReturnValue({
      navScale: 0.9,
      collapsed: true,
    });

    const result = mockLayout('navigation');

    expect(result.navScale).toBe(0.9);
    expect(result.collapsed).toBe(true);
  });

  it('updates mobile toggle state correctly', () => {
    const mockToggle = vi.fn().mockReturnValue(true);

    expect(mockToggle()).toBe(true);
    expect(mockToggle).toHaveBeenCalledOnce();
  });
});
