import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportSvgToPdf } from './pdf-export';

describe('exportSvgToPdf', () => {
  let mockCanvasContext: {
    fillStyle: string;
    fillRect: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
    toDataURL: ReturnType<typeof vi.fn>;
    canvas: HTMLCanvasElement;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    mockCanvasContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,mockpng'),
      canvas: {} as HTMLCanvasElement,
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext as never);
  });

  it('falls back to addImage when the PDF library does not expose svg rendering', async () => {
    class MockImage {
      public onload: (() => void) | null = null;
      public onerror: ((e?: string | Event) => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal('Image', MockImage);

    const pdf = {
      internal: {
        pageSize: {
          getWidth: () => 600,
          getHeight: () => 400,
        },
      },
      addImage: vi.fn(),
      save: vi.fn(),
    };

    const svgMarkup =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" /></svg>';

    await exportSvgToPdf(svgMarkup, 'badge.pdf', pdf as never);

    expect(pdf.addImage).toHaveBeenCalled();
    expect(pdf.save).toHaveBeenCalledWith('badge.pdf');
    // Background is filled with the SVG's own bg color (default dark theme).
    // Canvas normalises hex colors to uppercase internally.
    expect(mockCanvasContext.fillStyle.toLowerCase()).toBe('#0d1117');
    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
  });

  it('uses viewBox dimensions when width/height attributes are missing', async () => {
    class MockImage {
      public onload: (() => void) | null = null;
      public onerror: ((e?: string | Event) => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal('Image', MockImage);

    const pdf = {
      internal: {
        pageSize: {
          getWidth: () => 600,
          getHeight: () => 400,
        },
      },
      addImage: vi.fn(),
      save: vi.fn(),
    };

    const svgMarkup =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100" /></svg>';

    await exportSvgToPdf(svgMarkup, 'badge.pdf', pdf as never);

    expect(pdf.addImage).toHaveBeenCalled();
    expect(pdf.save).toHaveBeenCalledWith('badge.pdf');
  });

  it('always uses canvas approach (ignores pdf.svg) for correct filter and gradient rendering', async () => {
    class MockImage {
      public onload: (() => void) | null = null;
      public onerror: ((e?: string | Event) => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal('Image', MockImage);

    const svgMock = vi.fn().mockImplementation(() => Promise.resolve());
    const saveMock = vi.fn();

    const pdf = {
      internal: {
        pageSize: {
          getWidth: () => 600,
          getHeight: () => 400,
        },
      },
      addImage: vi.fn(),
      save: saveMock,
      svg: svgMock,
    };

    const svgMarkup =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue" /></svg>';

    await exportSvgToPdf(svgMarkup, 'badge.pdf', pdf as never);

    // Canvas approach is always used — svg2pdf doesn't handle complex SVG filters
    expect(pdf.svg).not.toHaveBeenCalled();
    expect(pdf.addImage).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith('badge.pdf');
  });

  it('resolves CSS variables in auto-theme SVG for proper rendering', async () => {
    class MockImage {
      public onload: (() => void) | null = null;
      public onerror: ((e?: string | Event) => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal('Image', MockImage);

    const pdf = {
      internal: {
        pageSize: {
          getWidth: () => 600,
          getHeight: () => 400,
        },
      },
      addImage: vi.fn(),
      save: vi.fn(),
    };

    const svgMarkup =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="var(--cp-bg)" /></svg>';

    await exportSvgToPdf(svgMarkup, 'badge.pdf', pdf as never);

    expect(pdf.addImage).toHaveBeenCalled();
    expect(pdf.save).toHaveBeenCalledWith('badge.pdf');
  });
});
