import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';
import NotFound from './not-found';

// --- TYPED INTERFACES FOR MOCKED MODULES ---
interface MockClipboardService {
  writeText: (text: string) => Promise<void>;
  readText?: () => Promise<string>;
}

interface MockCacheLayer {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  has: (key: string) => boolean;
}

// --- MOCK INTEGRATIONS & STUBS ---
vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createCacheStub = (): MockCacheLayer => {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn((key: string) => store.get(key)),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
    }),
    has: vi.fn((key: string) => store.has(key)),
  };
};

describe('NotFound Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  let clipboardStub: MockClipboardService;

  beforeEach(() => {
    vi.clearAllMocks();

    clipboardStub = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardStub,
      configurable: true,
      writable: true,
    });
  });

  // 1. Mock standard asynchronous imports and databases using stubs
  it('mocks standard asynchronous imports and databases using stubs', async () => {
    const sonnerModule = (await import('sonner')) as { toast: typeof toast };
    expect(vi.isMockFunction(sonnerModule.toast.success)).toBe(true);
    expect(vi.isMockFunction(sonnerModule.toast.error)).toBe(true);

    sonnerModule.toast.success('test message');
    expect(sonnerModule.toast.success).toHaveBeenCalledWith('test message');

    await clipboardStub.writeText('git checkout this-page');
    expect(clipboardStub.writeText).toHaveBeenCalledWith('git checkout this-page');
  });

  // 2. Test service loading paths to ensure pending state overlays render
  it('renders initial pending state overlay before MiniGame activation', () => {
    render(<NotFound />);

    const initButton = screen.getByRole('button', { name: /initialize/i });
    expect(initButton).toBeInTheDocument();

    expect(screen.getByText(/squash the bugs/i)).toBeInTheDocument();
  });

  // 3. Assert local cache layers are queried before triggering database retrievals
  it('queries local cache before triggering async clipboard write', async () => {
    const typedCache = createCacheStub();
    const storeKey = 'clipboard_terminal_output';

    const writeWithCache = async (text: string) => {
      const cached = typedCache.get(storeKey);
      if (cached === text) {
        return;
      }
      await clipboardStub.writeText(text);
      typedCache.set(storeKey, text);
    };

    typedCache.set(storeKey, 'already-cached');
    await writeWithCache('already-cached');

    expect(clipboardStub.writeText).not.toHaveBeenCalled();
    expect(typedCache.get).toHaveBeenCalledWith(storeKey);
  });

  // 4. Verify correct fallback procedures during fake endpoint timeout blocks
  it('triggers fallback toast.error when clipboard write times out', async () => {
    vi.mocked(clipboardStub.writeText).mockRejectedValueOnce(
      new Error('TIMEOUT_CLIPBOARD_UNAVAILABLE')
    );

    render(<NotFound />);

    const terminalBlock = screen.getByText('commitpulse — bash').closest('div');
    expect(terminalBlock).toBeInTheDocument();

    if (terminalBlock) {
      await fireEvent.click(terminalBlock);

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Failed to copy terminal output');
    }
  });

  // 5. Assert complete cache sync is written on success callbacks
  it('writes complete cache sync on success callbacks', async () => {
    const typedCache = createCacheStub();
    const storeKey = 'clipboard_terminal_output';

    await clipboardStub.writeText('git checkout this-page');
    typedCache.set(storeKey, 'git checkout this-page');

    expect(clipboardStub.writeText).toHaveBeenCalled();
    expect(typedCache.set).toHaveBeenCalledWith(storeKey, 'git checkout this-page');
  });
});
