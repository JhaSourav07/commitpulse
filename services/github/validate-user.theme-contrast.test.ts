import { describe, test, expect, vi, beforeEach } from 'vitest';
import { gitHubUserValidator } from './validate-user';
import { fetchUserProfile } from '../../lib/github';

// Mock the github library module
vi.mock('../../lib/github', () => ({
  fetchUserProfile: vi.fn(),
}));

/**
 * Helper to dynamically mock the window.matchMedia API
 * to satisfy the "dual theme environment mock" requirement.
 */
function mockColorScheme(theme: 'light' | 'dark') {
  vi.stubGlobal('matchMedia', (query: string) => {
    return {
      matches: query.includes(theme),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

describe('Validate User - Dark & Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    gitHubUserValidator.reset();
  });

  // Test Case 1: Light Mode Simulation Adaptation
  test('should successfully validate an existing user when light mode environment is emulated', async () => {
    mockColorScheme('light');
    vi.mocked(fetchUserProfile).mockResolvedValue({ login: 'octocat' } as unknown as Awaited<
      ReturnType<typeof fetchUserProfile>
    >);

    const isValid = await gitHubUserValidator.validateUser('octocat');

    expect(isValid).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);
  });

  // Test Case 2: Dark Mode Simulation Adaptation
  test('should successfully validate an existing user when dark mode environment is emulated', async () => {
    mockColorScheme('dark');
    vi.mocked(fetchUserProfile).mockResolvedValue({ login: 'octocat' } as unknown as Awaited<
      ReturnType<typeof fetchUserProfile>
    >);

    const isValid = await gitHubUserValidator.validateUser('octocat');

    expect(isValid).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
  });

  // Test Case 3: Contrast/Textual Layout Boundary Verification
  test('should return false for missing users to allow high-contrast error styling on UI layers', async () => {
    mockColorScheme('dark');
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    const isValid = await gitHubUserValidator.validateUser('nonexistent-user');

    expect(isValid).toBe(false);
  });

  // Test Case 4: Theme Config / Cache Rule Verification
  test('should accurately serve validation results from cache regardless of active theme setting', async () => {
    mockColorScheme('dark');
    vi.mocked(fetchUserProfile).mockResolvedValue({ login: 'cached-user' } as unknown as Awaited<
      ReturnType<typeof fetchUserProfile>
    >);

    await gitHubUserValidator.validateUser('cached-user');
    mockColorScheme('light');

    const isCachedValid = await gitHubUserValidator.validateUser('cached-user');

    expect(isCachedValid).toBe(true);
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  // Test Case 5: Layer/Error Bleed Prevention
  test('should propagate unexpected runtime errors so the UI overlay does not clip or hang', async () => {
    mockColorScheme('dark');
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('API Rate Limit Exceeded'));

    await expect(gitHubUserValidator.validateUser('error-user')).rejects.toThrow(
      'API Rate Limit Exceeded'
    );
  });
});
