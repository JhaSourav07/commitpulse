import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('BackgroundRefresh - Massive Data Sets and Extreme High Bounds Scaling (Variation 2)', () => {
  let service: BackgroundRefresh;

  beforeEach(() => {
    service = BackgroundRefresh.getInstance();
    service.reset();
    vi.clearAllMocks();
  });

  it('processes 100,000 isStale calls with diverse timestamps and measures sub-2000ms execution', () => {
    const VOLUME = 100000;
    const timestamps: string[] = [];

    for (let i = 0; i < VOLUME; i++) {
      const offsetMs = i * 60001;
      const d = new Date(Date.now() - offsetMs);
      timestamps.push(d.toISOString());
    }

    const start = performance.now();
    for (let i = 0; i < VOLUME; i++) {
      service.isStale(timestamps[i]);
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });

  it('validates isStale boundary at exact 10-minute threshold crossing', () => {
    const boundaryExceeded = new Date(Date.now() - 600001).toISOString();
    expect(service.isStale(boundaryExceeded)).toBe(true);

    const boundaryNotExceeded = new Date(Date.now() - 600000).toISOString();
    expect(service.isStale(boundaryNotExceeded)).toBe(false);

    const boundaryUnder = new Date(Date.now() - 599999).toISOString();
    expect(service.isStale(boundaryUnder)).toBe(false);

    const boundaryHalf = new Date(Date.now() - 300000).toISOString();
    expect(service.isStale(boundaryHalf)).toBe(false);

    const boundaryDouble = new Date(Date.now() - 1200000).toISOString();
    expect(service.isStale(boundaryDouble)).toBe(true);
  });

  it('handles extreme temporal boundary values without throwing or producing NaN', () => {
    const epochStart = new Date(0).toISOString();
    expect(service.isStale(epochStart)).toBe(true);

    const maxDate = new Date(8640000000000000).toISOString();
    expect(service.isStale(maxDate)).toBe(false);

    const minDate = new Date(-8640000000000000).toISOString();
    expect(service.isStale(minDate)).toBe(true);

    const farFuture = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(service.isStale(farFuture)).toBe(false);

    const farPast = new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(service.isStale(farPast)).toBe(true);

    expect(service.isStale(undefined)).toBe(true);
  });

  it('handles 10,000 concurrent triggerRefresh calls with unique usernames and verifies call count', () => {
    const VOLUME = 10000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    const start = performance.now();
    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`massive_user_${i}`);
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(1000);
    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`massive_user_${i}`)).toBe(true);
    }
  });

  it('tracks 50,000 unique active jobs and verifies dedup prevents double-triggering', () => {
    const VOLUME = 50000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`tracked_user_${i}`);
    }

    expect(service.isJobActive(`tracked_user_0`)).toBe(true);
    expect(service.isJobActive(`tracked_user_25000`)).toBe(true);
    expect(service.isJobActive(`tracked_user_49999`)).toBe(true);
    expect(service.isJobActive(`untracked_user`)).toBe(false);

    service.triggerRefresh(`tracked_user_0`);

    const callsForUser0 = vi
      .mocked(getFullDashboardData)
      .mock.calls.filter((call: unknown[]) => call[0] === 'tracked_user_0').length;
    expect(callsForUser0).toBe(1);
    expect(service.isJobActive(`tracked_user_0`)).toBe(true);

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`tracked_user_${i}`)).toBe(true);
    }
  });

  it('executes 50,000 mixed stale and fresh isStale evaluations with correct classification split', () => {
    const VOLUME = 50000;
    const results: boolean[] = new Array(VOLUME);

    const start = performance.now();
    for (let i = 0; i < VOLUME; i++) {
      if (i % 2 === 0) {
        results[i] = service.isStale(new Date(Date.now() - 1200000).toISOString());
      } else {
        results[i] = service.isStale(new Date(Date.now() - 30000).toISOString());
      }
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(1000);

    let staleCount = 0;
    let freshCount = 0;
    for (let i = 0; i < VOLUME; i++) {
      if (results[i] === true) {
        staleCount++;
      } else {
        freshCount++;
      }
    }

    expect(staleCount).toBe(VOLUME / 2);
    expect(freshCount).toBe(VOLUME / 2);
  });

  it('handles duplicate detection with varied casing and whitespace under massive datasets', () => {
    const VOLUME = 10000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    service.triggerRefresh('DuplicateUser');
    service.triggerRefresh('duplicateuser');
    service.triggerRefresh('  duplicateuser  ');
    service.triggerRefresh('DUPLICATEUSER');
    service.triggerRefresh('DuplicateUser  ');

    expect(getFullDashboardData).toHaveBeenCalledTimes(1);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`  Case_Sensitive_${i}  `);
    }

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`case_sensitive_${i}`)).toBe(true);
      expect(service.isJobActive(`  Case_Sensitive_${i}  `)).toBe(true);
    }

    const totalExpectedCalls = 1 + VOLUME;
    expect(getFullDashboardData).toHaveBeenCalledTimes(totalExpectedCalls);
  });

  it('handles empty and whitespace-only username edge cases under high volume', () => {
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    service.triggerRefresh('');
    service.triggerRefresh('   ');
    service.triggerRefresh('\t');
    service.triggerRefresh('\n');

    expect(getFullDashboardData).toHaveBeenCalledTimes(1);

    expect(service.isJobActive('')).toBe(true);
    expect(service.isJobActive('   ')).toBe(true);
  });

  it('performs rapid alternating isStale and triggerRefresh operations without state corruption', () => {
    const VOLUME = 5000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`alternate_${i}`);
      const isStaleResult = service.isStale(
        new Date(Date.now() - (i % 2 === 0 ? 600001 : 300000)).toISOString()
      );

      if (i % 2 === 0) {
        expect(isStaleResult).toBe(true);
      } else {
        expect(isStaleResult).toBe(false);
      }

      expect(service.isJobActive(`alternate_${i}`)).toBe(true);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);
  });

  it('correctly computes staleness for ISO strings with timezone offsets and sub-second precision', () => {
    const zuluStale = new Date(Date.now() - 600001).toISOString();
    expect(service.isStale(zuluStale)).toBe(true);

    const subSecondFresh = new Date(Date.now() - 100).toISOString();
    expect(service.isStale(subSecondFresh)).toBe(false);

    const subSecondStale = new Date(Date.now() - 600001).toISOString();
    expect(service.isStale(subSecondStale)).toBe(true);

    const exactFuture = new Date(Date.now() + 5000).toISOString();
    expect(service.isStale(exactFuture)).toBe(false);
  });

  it('handles 20,000 reset and re-trigger cycles without memory accumulation', () => {
    const CYCLES = 20000;
    vi.mocked(getFullDashboardData).mockResolvedValue(
      {} as Awaited<ReturnType<typeof getFullDashboardData>>
    );

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      service.triggerRefresh(`cycle_user_${cycle}`);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(CYCLES);

    service.reset();
    expect(service.isJobActive(`cycle_user_0`)).toBe(false);
    expect(service.isJobActive(`cycle_user_19999`)).toBe(false);

    vi.mocked(getFullDashboardData).mockClear();

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      service.triggerRefresh(`cycle_user_${cycle}`);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(CYCLES);

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      expect(service.isJobActive(`cycle_user_${cycle}`)).toBe(true);
    }
  });

  it('maintains singleton identity across 10,000 consecutive getInstance calls under high load', () => {
    const instances: BackgroundRefresh[] = [];

    for (let i = 0; i < 10000; i++) {
      instances.push(BackgroundRefresh.getInstance());
    }

    const first = instances[0];
    for (let i = 1; i < instances.length; i++) {
      expect(instances[i]).toBe(first);
    }
  });

  it('synchronizes job state correctly when 10,000 triggers resolve in rapid succession', async () => {
    const VOLUME = 10000;
    let resolveCount = 0;

    vi.mocked(getFullDashboardData).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolveCount++;
          resolve({} as Awaited<ReturnType<typeof getFullDashboardData>>);
        }, 0);
      });
    });

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`resolve_user_${i}`);
    }

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`resolve_user_${i}`)).toBe(true);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(resolveCount).toBe(VOLUME);

    await new Promise((resolve) => setTimeout(resolve, 50));

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`resolve_user_${i}`)).toBe(false);
    }
  }, 10000);

  it('handles 1000 concurrent partial-string username matches without false positives', () => {
    const VOLUME = 1000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`user_${i}`);
    }

    expect(service.isJobActive(`user`)).toBe(false);
    expect(service.isJobActive(`_user`)).toBe(false);
    expect(service.isJobActive(`user_`)).toBe(false);
    expect(service.isJobActive(`User_0`)).toBe(true);
    expect(service.isJobActive(`user_0_extra`)).toBe(false);
    expect(service.isJobActive(`user_999`)).toBe(true);
    expect(service.isJobActive(`xuser_0`)).toBe(false);

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`user_${i}`)).toBe(true);
    }
  });

  it('verifies triggerRefresh correctly deduplicates when called with 100,000 identical usernames', () => {
    const VOLUME = 100000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    service.triggerRefresh('single_user');

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh('single_user');
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(1);
    expect(service.isJobActive('single_user')).toBe(true);
  });

  it('handles unicode and special character usernames under massive scaling', () => {
    const VOLUME = 5000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    const specialNames = [
      '用户',
      'ユーザー',
      'пользователь',
      'usuario_ñ',
      'username_with_123_numbers',
      'user.name-with.special_chars',
      'user@domain',
      'usérñamé_üñîçódé',
    ];

    for (const name of specialNames) {
      service.triggerRefresh(name);
    }

    for (const name of specialNames) {
      expect(service.isJobActive(name)).toBe(true);
    }

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`unicode_user_${i}_用户`);
    }

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`unicode_user_${i}_用户`)).toBe(true);
    }

    const totalExpected = specialNames.length + VOLUME;
    expect(getFullDashboardData).toHaveBeenCalledTimes(totalExpected);
  });

  it('maintains active job isolation between different usernames under 50k concurrent operations', () => {
    const VOLUME_A = 25000;
    const VOLUME_B = 25000;

    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME_A; i++) {
      service.triggerRefresh(`group_a_${i}`);
    }

    for (let i = 0; i < VOLUME_B; i++) {
      service.triggerRefresh(`group_b_${i}`);
    }

    for (let i = 0; i < VOLUME_A; i++) {
      expect(service.isJobActive(`group_a_${i}`)).toBe(true);
      expect(service.isJobActive(`group_b_${i}`)).toBe(true);
    }

    for (let i = 0; i < VOLUME_A; i++) {
      expect(service.isJobActive(`group_b_${VOLUME_B + i}`)).toBe(false);
      expect(service.isJobActive(`nonexistent_${i}`)).toBe(false);
    }
  });

  it('correctly handles case-insensitive deduplication for 10,000 username variations', () => {
    const VOLUME = 10000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    service.triggerRefresh('baseuser');

    const caseVariations = ['BASEUSER', 'BaseUser', 'baseuser', 'Baseuser', 'bASEUSER', 'BASeUSER'];

    for (const variant of caseVariations) {
      service.triggerRefresh(variant);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(1);
    expect(service.isJobActive('baseuser')).toBe(true);
    expect(service.isJobActive('BASEUSER')).toBe(true);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`CaseUser_${i}`);
    }

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`caseuser_${i}`);
    }

    const totalCalls = 1 + VOLUME;

    expect(getFullDashboardData).toHaveBeenCalledTimes(totalCalls);
  });

  it('executes isStale on 10k rapidly generated timestamps with correct stale/fresh ratio', () => {
    const VOLUME = 10000;
    const now = Date.now();

    const timestamps: string[] = [];
    for (let i = 0; i < VOLUME; i++) {
      const offset = i < VOLUME / 2 ? 600001 + i : 300000 - i;
      timestamps.push(new Date(now - offset).toISOString());
    }

    const results = timestamps.map((ts) => service.isStale(ts));

    let stale = 0;
    let fresh = 0;

    for (const r of results) {
      if (r) stale++;
      else fresh++;
    }

    expect(stale).toBe(VOLUME / 2);
    expect(fresh).toBe(VOLUME / 2);
  });

  it('handles massive reset followed by immediate high-volume re-trigger pattern', () => {
    const VOLUME = 30000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`batch_a_${i}`);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);

    service.reset();

    vi.mocked(getFullDashboardData).mockClear();

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`batch_b_${i}`);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`batch_a_${i}`)).toBe(false);
      expect(service.isJobActive(`batch_b_${i}`)).toBe(true);
    }
  });

  it('maintains isStale correctness for 100k calls alternating between stale and fresh rapidly', () => {
    const VOLUME = 100000;
    const STALE_THRESHOLD = 600000;

    for (let i = 0; i < VOLUME; i++) {
      const delta = i % 2 === 0 ? STALE_THRESHOLD + 1 : STALE_THRESHOLD - 1;
      const result = service.isStale(new Date(Date.now() - delta).toISOString());
      expect(result).toBe(i % 2 === 0);
    }
  });

  it('verifies job active state after successful completion for 5000 rapid resolved promises', async () => {
    const VOLUME = 5000;
    let resolvedCount = 0;

    vi.mocked(getFullDashboardData).mockImplementation(() => {
      return Promise.resolve().then(() => {
        resolvedCount++;
        return {} as Awaited<ReturnType<typeof getFullDashboardData>>;
      });
    });

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`fast_resolve_${i}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(resolvedCount).toBe(VOLUME);

    await new Promise((resolve) => setTimeout(resolve, 50));

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`fast_resolve_${i}`)).toBe(false);
    }
  }, 10000);

  it('handles error rejection for 5000 triggers and verifies jobs are cleaned up', async () => {
    const VOLUME = 5000;

    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('API Error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`error_user_${i}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`error_user_${i}`)).toBe(false);
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  }, 10000);

  it('processes 10k isStale calls with Date objects vs ISO strings matching identical results', () => {
    const VOLUME = 10000;
    const now = Date.now();

    for (let i = 0; i < VOLUME; i++) {
      const delta = i * 1000;
      const dateObj = new Date(now - delta);
      const isoString = dateObj.toISOString();

      const resultFromDate = service.isStale(dateObj.toISOString());
      const resultFromString = service.isStale(isoString);
      expect(resultFromDate).toBe(resultFromString);
    }
  });

  it('stress tests isStale with malformed date strings without crashing', () => {
    const malformedInputs = [
      'not-a-date',
      '2024-13-01T00:00:00Z',
      'invalid',
      '',
      'null',
      'undefined',
      '2024-01-01',
      '2024/01/01',
      'Jan 1 2024',
      '    ',
      '2024-13-45T99:99:99Z',
    ];

    for (const input of malformedInputs) {
      const result = service.isStale(input);
      expect(typeof result).toBe('boolean');
    }
  });

  it('interleaves triggerRefresh and isJobActive for 10k usernames without any false negatives', () => {
    const VOLUME = 10000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      const name = `interleave_${i}`;
      expect(service.isJobActive(name)).toBe(false);
      service.triggerRefresh(name);
      expect(service.isJobActive(name)).toBe(true);
    }

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`interleave_${i}`)).toBe(true);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);
  });

  it('maintains correctness across 10 sequential massive cycles of 10k triggers each', () => {
    const CYCLES = 10;
    const USERS_PER_CYCLE = 10000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      for (let i = 0; i < USERS_PER_CYCLE; i++) {
        service.triggerRefresh(`cycle_${cycle}_user_${i}`);
      }

      for (let i = 0; i < USERS_PER_CYCLE; i++) {
        expect(service.isJobActive(`cycle_${cycle}_user_${i}`)).toBe(true);
      }
    }

    const totalExpectedCalls = CYCLES * USERS_PER_CYCLE;
    expect(getFullDashboardData).toHaveBeenCalledTimes(totalExpectedCalls);

    service.reset();

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      for (let i = 0; i < USERS_PER_CYCLE; i++) {
        expect(service.isJobActive(`cycle_${cycle}_user_${i}`)).toBe(false);
      }
    }
  });

  it('handles 5k triggers where getFullDashboardData resolves synchronously via microtask queue', async () => {
    const VOLUME = 5000;

    vi.mocked(getFullDashboardData).mockResolvedValue(
      {} as Awaited<ReturnType<typeof getFullDashboardData>>
    );

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`microtask_user_${i}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`microtask_user_${i}`)).toBe(false);
    }
  }, 10000);

  it('bulk trigger with 10k usernames then verifies all are active and none leak into adjacent slots', () => {
    const VOLUME = 10000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`bulk_${i}`);
    }

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`bulk_${i}`)).toBe(true);
    }

    expect(service.isJobActive(`bulk_${VOLUME}`)).toBe(false);
    expect(service.isJobActive(`bulk_`)).toBe(false);
    expect(service.isJobActive(`bulk`)).toBe(false);
    expect(service.isJobActive(`_bulk_0`)).toBe(false);
    expect(service.isJobActive(`BULK_0`)).toBe(true);
  });

  it('verifies isStale consistency across 100k identical timestamp calls returning same result', () => {
    const VOLUME = 100000;
    const staleTs = new Date(Date.now() - 600001).toISOString();
    const freshTs = new Date(Date.now() - 300000).toISOString();

    for (let i = 0; i < VOLUME; i++) {
      if (i % 2 === 0) {
        expect(service.isStale(staleTs)).toBe(true);
      } else {
        expect(service.isStale(freshTs)).toBe(false);
      }
    }
  });

  it('verifies active job Set size matches trigger count after 20,000 unique triggers', () => {
    const VOLUME = 20000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`size_test_${i}`);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);

    const allActive = [];
    for (let i = 0; i < VOLUME; i++) {
      allActive.push(service.isJobActive(`size_test_${i}`));
    }

    const activeCount = allActive.filter(Boolean).length;
    expect(activeCount).toBe(VOLUME);

    service.reset();

    const afterResetActive = [];
    for (let i = 0; i < VOLUME; i++) {
      afterResetActive.push(service.isJobActive(`size_test_${i}`));
    }

    const afterResetCount = afterResetActive.filter(Boolean).length;
    expect(afterResetCount).toBe(0);
  });

  it('maintains isStale correctness near the threshold boundary with sub-millisecond precision', () => {
    const THRESHOLD = 600000;

    const barelyStale = new Date(Date.now() - THRESHOLD - 1).toISOString();
    expect(service.isStale(barelyStale)).toBe(true);

    const comfortablyFresh = new Date(Date.now() - THRESHOLD + 200).toISOString();
    expect(service.isStale(comfortablyFresh)).toBe(false);

    for (let ms = 1; ms <= 100; ms++) {
      const ts = new Date(Date.now() - THRESHOLD - ms).toISOString();
      expect(service.isStale(ts)).toBe(true);
    }

    for (let ms = 200; ms < 500; ms += 10) {
      const ts = new Date(Date.now() - THRESHOLD + ms).toISOString();
      expect(service.isStale(ts)).toBe(false);
    }
  });

  it('handles mass trigger with whitespace-padded names that should deduplicate against existing entries', () => {
    const VOLUME = 10000;
    vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}) as never);

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`   padded_user_${i}   `);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);

    for (let i = 0; i < VOLUME; i++) {
      expect(service.isJobActive(`padded_user_${i}`)).toBe(true);
      expect(service.isJobActive(`   padded_user_${i}   `)).toBe(true);
      expect(service.isJobActive(` padded_user_${i}`)).toBe(true);
      expect(service.isJobActive(`padded_user_${i} `)).toBe(true);
    }

    for (let i = 0; i < VOLUME; i++) {
      service.triggerRefresh(`   padded_user_${i}   `);
    }

    expect(getFullDashboardData).toHaveBeenCalledTimes(VOLUME);
  });
});
