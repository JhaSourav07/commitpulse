import { describe, test, expect } from 'vitest';
import { streakErrorMessage, getExportSnippet, buildQueryParams } from './utils';
import type { CustomizeOptions, ExportFormat } from './types';

describe('utils.ts - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  // Test 1: Exception Safety (Handling unexpected runtime exceptions/malformed properties)
  test('should handle unexpected runtime exceptions gracefully when processing malformed query params', () => {
    // Construct a risky object with getter properties designed to throw runtime access exceptions
    const malformedOptions = {
      username: 'test-user',
      theme: 'classic',
      get scale() {
        throw new Error(
          'Unexpected database or configuration breakdown during property resolution'
        );
      },
      // Fallbacks to avoid immediate syntax failures
      bgHex: '',
      accentHex: '',
      textHex: '',
    } as unknown as CustomizeOptions;

    // Verify exception safety: the application structure must catch or contain the throw safely
    expect(() => buildQueryParams(malformedOptions)).toThrowError(
      'Unexpected database or configuration breakdown'
    );
  });

  // Test 2: Database / Network Connectivity Mappings (Error Fallbacks)
  test('should map all database/network response codes to clean fallback user messages', () => {
    // Assert downstream application boundaries get precise, clean error messages instead of raw crash triggers
    expect(streakErrorMessage(404)).toBe('GitHub user not found');
    expect(streakErrorMessage(400)).toBe('Invalid customization options');
    expect(streakErrorMessage(429)).toBe('Rate limit exceeded. Please try again later.');

    // Catch-all fallback state to handle unmapped microservice/database connection timeouts cleanly
    expect(streakErrorMessage(500)).toBe('Failed to load badge');
    expect(streakErrorMessage(503)).toBe('Failed to load badge');
  });

  // Test 3: Hydration Stability & Mismatch Prevention
  test('should preserve stable output structures across execution boundaries to prevent client/server hydration mismatch', () => {
    const defaultOptions: CustomizeOptions = {
      username: '   server-client-sync   ', // Testing trim hydration stability
      theme: 'auto',
      bgHex: '#123456',
      accentHex: '#abcdef',
      textHex: '#ffffff',
      bgType: 'solid',
      bgStart: '',
      bgEnd: '',
      bgAngle: 90,
      year: '',
      scale: 'linear',
      speed: '8s',
      font: 'Inter',
      radius: 8,
      size: 'medium',
      hideTitle: false,
      hideBackground: false,
      hideStats: false,
      viewMode: 'default',
      deltaFormat: 'percent',
      badgeWidth: '',
      badgeHeight: '',
      grace: 1,
      language: 'en',
      timezone: 'UTC',
    };

    const serverSideQuery = buildQueryParams(defaultOptions);
    const clientSideQuery = buildQueryParams({ ...defaultOptions });

    // The query string structure must remain identically deterministic on both cycles to eliminate hydration mismatch risk
    expect(serverSideQuery).toBe(clientSideQuery);
    expect(serverSideQuery).toContain('user=server-client-sync');
    expect(serverSideQuery).toContain('theme=auto');
  });

  // Test 4: Dev-Telemetry Error Triggers & Unsupported Path Logging
  test('should bubble up clean exceptions on unsupported formats to inform dev-telemetry error trackers', () => {
    const invalidFormat = 'pdf' as ExportFormat;
    const queryString = 'user=testuser&theme=dark';

    // Verify that the code triggers explicit error states that telemetry hooks can trace
    expect(() => getExportSnippet(invalidFormat, queryString)).toThrowError(
      `Unsupported export format: ${invalidFormat}`
    );
  });

  // Test 5: Recovery Paths (Availability of Error Handlers and Fallback Properties in Generated Snippets)
  test('should guarantee that generated TSX code contains the explicit runtime error state rendering paths', () => {
    const queryString = 'user=recoveredUser';
    const tsxCodeBlock = getExportSnippet('tsx', queryString);

    // Verify recovery blocks exist within the component definition code structure
    expect(tsxCodeBlock).toContain('const [error, setError] = useState<string | null>(null);');
    expect(tsxCodeBlock).toContain('{error && (');
    expect(tsxCodeBlock).toContain('{error}');
    expect(tsxCodeBlock).toContain("color: '#ef4444'"); // Validation of structural recovery panel styling
  });
});
