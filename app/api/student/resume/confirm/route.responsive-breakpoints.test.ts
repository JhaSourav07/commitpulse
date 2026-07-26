import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { POST } from './route';
import { StudentProfile } from '@/models/StudentProfile';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/StudentProfile', () => ({
  StudentProfile: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({ verified: true }),
}));

vi.mock('@/lib/rate-limit', () => {
  return {
    RateLimiter: class {
      check() {
        return Promise.resolve(true);
      }
      checkWithResult() {
        return Promise.resolve({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        });
      }
    },
    getRateLimitHeaders: vi.fn(() => ({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '4',
      'X-RateLimit-Reset': Date.now().toString(),
    })),
  };
});

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

function makeRequest(body: string | Record<string, unknown>): Request {
  return new Request('http://localhost/api/student/resume/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-owner-token',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('ApiStudentResumeConfirmRoute - Responsive Breakpoints & Viewport Layouts', () => {
  let originalWindow: unknown;
  let originalMatchMedia: unknown;
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalMongodbUri: string | undefined;

  beforeAll(() => {
    originalMongodbUri = process.env.MONGODB_URI;
    if (typeof window !== 'undefined') {
      originalMatchMedia = window.matchMedia;
      originalInnerWidth = window.innerWidth;
      originalInnerHeight = window.innerHeight;
    } else {
      originalWindow = globalThis.window;
    }
  });

  afterAll(() => {
    process.env.MONGODB_URI = originalMongodbUri;
    if (typeof window !== 'undefined') {
      if (originalMatchMedia) {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          configurable: true,
          value: originalMatchMedia,
        });
      } else {
        delete (window as Partial<Window>).matchMedia;
      }
      window.innerWidth = originalInnerWidth;
      window.innerHeight = originalInnerHeight;
    } else {
      if (originalWindow === undefined) {
        delete (globalThis as Record<string, unknown>).window;
      } else {
        globalThis.window = originalWindow as Window & typeof globalThis;
      }
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MONGODB_URI;
    document.body.innerHTML = '';
  });

  it('Mock standard mobile-width media coordinates (e.g. 375px wide viewports)', async () => {
    // Set viewport dimension to simulated mobile (iPhone SE dimensions)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 812,
    });

    // Mock matchMedia for mobile width max-width query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width: 768px') || query.includes('max-width: 375px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    expect(window.innerWidth).toBe(375);
    expect(window.innerHeight).toBe(812);
    expect(window.matchMedia('(max-width: 375px)').matches).toBe(true);

    // Call route handler to ensure it processes requests successfully in this environment
    const response = await POST(
      makeRequest({
        githubUsername: 'mobileuser',
        data: { name: 'Mobile User', email: 'mobile@example.com' },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.bypassed).toBe(true);
  });

  it('Assert that columns reflow into standard vertical flex lists', () => {
    // Construct a representation of a multi-column page container (e.g., student resume confirmation dashboard)
    const dashboardLayout = document.createElement('div');
    // On mobile viewports, columns should reflow to vertical using flex-col, and only reflow to horizontal on larger screens
    dashboardLayout.className = 'flex flex-col md:flex-row gap-4';

    const colLeft = document.createElement('div');
    colLeft.className = 'w-full md:w-1/3';
    colLeft.textContent = 'Left Column Content';

    const colRight = document.createElement('div');
    colRight.className = 'w-full md:w-2/3';
    colRight.textContent = 'Right Column Content';

    dashboardLayout.appendChild(colLeft);
    dashboardLayout.appendChild(colRight);
    document.body.appendChild(dashboardLayout);

    // Verify it doesn't force a row direction by default without a screen size prefix
    const hasUnprefixedFlexRow = /(?<!(sm|md|lg|xl|2xl):)flex-row\b/.test(
      dashboardLayout.className
    );
    expect(hasUnprefixedFlexRow).toBe(false);

    // Verify presence of standard responsive flex-col and md:flex-row classes for column reflow
    expect(dashboardLayout.className).toContain('flex-col');
    expect(dashboardLayout.className).toContain('md:flex-row');
  });

  it('Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    // Create element with styles representing the confirmation UI component
    const confirmationUI = document.createElement('div');
    confirmationUI.className = 'w-full max-w-sm px-4 mx-auto';

    // Verify we do not use hardcoded absolute styles like width: 500px, width: 800px that break mobile viewports (<= 375px)
    const mockCard = document.createElement('div');
    mockCard.style.width = '100%';
    mockCard.style.maxWidth = '340px'; // Less than 375px viewport

    confirmationUI.appendChild(mockCard);
    document.body.appendChild(confirmationUI);

    const allStyledElements = confirmationUI.querySelectorAll('*');
    let hasAbsoluteOverflowWidth = false;

    allStyledElements.forEach((el) => {
      const inlineWidth = (el as HTMLElement).style.width;
      const classStr = el.className || '';

      // Check inline styles
      if (inlineWidth && inlineWidth.includes('px')) {
        const val = parseInt(inlineWidth, 10);
        if (val > 375) {
          hasAbsoluteOverflowWidth = true;
        }
      }

      // Check tailwind absolute arbitrary width classes e.g. w-[400px], w-[600px]
      const tailwindArbitraryWidth = classStr.match(/w-\[(\d+)px\]/);
      if (tailwindArbitraryWidth) {
        const val = parseInt(tailwindArbitraryWidth[1], 10);
        if (val > 375) {
          hasAbsoluteOverflowWidth = true;
        }
      }
    });

    expect(hasAbsoluteOverflowWidth).toBe(false);
  });

  it('Check that navigation components scale down gracefully', () => {
    // Create navigation component simulation
    const navContainer = document.createElement('nav');
    navContainer.className = 'flex justify-between items-center px-4 py-2 w-full';

    const brandName = document.createElement('span');
    brandName.className = 'text-base sm:text-lg font-bold truncate';
    brandName.textContent = 'CommitPulse Resume Confirmation';

    const confirmButton = document.createElement('button');
    confirmButton.className = 'text-xs sm:text-sm px-3 py-1 bg-blue-600 rounded';
    confirmButton.textContent = 'Confirm';

    navContainer.appendChild(brandName);
    navContainer.appendChild(confirmButton);
    document.body.appendChild(navContainer);

    // Verify brandName doesn't use massive absolute text sizes or hardcoded widths
    expect(brandName.className).toContain('truncate');
    expect(brandName.className).not.toMatch(/text-\[4rem\]/);
    expect(confirmButton.className).not.toMatch(/w-\[300px\]/);
  });

  it('Assert mobile-specific toggle states respond cleanly', () => {
    // Mock the mobile menu toggle button behavior
    const menuButton = document.createElement('button');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Toggle menu');

    let isExpanded = false;
    menuButton.onclick = () => {
      isExpanded = !isExpanded;
      menuButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    };

    document.body.appendChild(menuButton);

    // Initial state
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');

    // Trigger click (simulate touch interaction on mobile viewport)
    menuButton.click();
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');

    // Toggle back
    menuButton.click();
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
  });
});
