import { describe, expect, it } from 'vitest';
import { User } from './User';

interface ContributorLog {
  actionId: string;
  timestamp: number;
  commits: number;
  points: number;
  hash: string;
}

interface UserSerializationLayout {
  username: string;
  visitCount: number;
  createdAt: string;
  actions: ContributorLog[];
  streak: number;
  score: number;
  coordinates: [number, number];
}

function serializeUserLayout(
  username: string,
  visitCount: number,
  createdAt: Date,
  actions: ContributorLog[],
  streak: number,
  score: number,
  coordinates: [number, number]
): string {
  const payload: UserSerializationLayout = {
    username,
    visitCount,
    createdAt: createdAt.toISOString(),
    actions,
    streak,
    score,
    coordinates,
  };
  return JSON.stringify(payload);
}

function calculateScalingCoordinates(points: number, commits: number): [number, number] {
  const maxVal = Number.MAX_SAFE_INTEGER;
  const x = Number.isFinite(points) && points > 0 ? (points / maxVal) * 1000 : 0;
  const y = Number.isFinite(commits) && commits > 0 ? (commits / maxVal) * 1000 : 0;
  return [
    Number.isNaN(x) || !Number.isFinite(x) ? 0 : x,
    Number.isNaN(y) || !Number.isFinite(y) ? 0 : y,
  ];
}

function formatLogCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return '0 logs';
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M logs`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K logs`;
  }
  return `${count} logs`;
}

interface MetricNode {
  id: string;
  value: number;
  children: MetricNode[];
}

function buildTree(id: string, depth: number, branching: number): MetricNode {
  const node: MetricNode = { id, value: 500.5, children: [] };
  if (depth > 0) {
    for (let i = 0; i < branching; i++) {
      node.children.push(buildTree(`${id}-${i}`, depth - 1, branching));
    }
  }
  return node;
}

describe('User Model Massive Scaling Tests (Variation 2)', () => {
  it('Case 1: Build a massive array payload representing extreme contributor logs and verify serialization does not throw', () => {
    const mockActions: ContributorLog[] = Array.from({ length: 11000 }, (_, i) => ({
      actionId: `action_${i}`,
      timestamp: Date.now() - i * 1000,
      commits: i % 5,
      points: i * 3,
      hash: `hash_${i.toString(16)}`,
    }));

    const testUser = new User({
      username: 'extreme_contributor',
      visitCount: 9999,
      createdAt: new Date(),
    });

    let result = '';
    expect(() => {
      result = serializeUserLayout(
        testUser.username,
        testUser.visitCount,
        testUser.createdAt,
        mockActions,
        150,
        75000,
        [500.2, 750.9]
      );
    }).not.toThrow();

    expect(result).toContain('extreme_contributor');
    expect(result).toContain('action_10999');
  });

  it('Case 2: Assert performance metrics by measuring calculation runtimes under strict limits (< 50ms)', () => {
    const mockActions: ContributorLog[] = Array.from({ length: 12000 }, (_, i) => ({
      actionId: `action_${i}`,
      timestamp: Date.now() - i * 1000,
      commits: i % 5,
      points: i * 3,
      hash: `hash_${i.toString(16)}`,
    }));

    const serialized = serializeUserLayout(
      'speedy_user',
      1200,
      new Date(),
      mockActions,
      400,
      98000,
      [12.3, 45.6]
    );

    const start = performance.now();
    const parsed = JSON.parse(serialized) as UserSerializationLayout;

    let sumCommits = 0;
    for (let i = 0; i < parsed.actions.length; i++) {
      sumCommits += parsed.actions[i].commits;
    }
    const end = performance.now();
    const elapsed = end - start;

    expect(elapsed).toBeLessThan(50);
    expect(sumCommits).toBeGreaterThan(0);
    expect(parsed.username).toBe('speedy_user');
  });

  it('Case 3: Test boundary overflow safety for maximum high-integer thresholds', () => {
    const [normX, normY] = calculateScalingCoordinates(500, 250);
    expect(Number.isFinite(normX)).toBe(true);
    expect(Number.isFinite(normY)).toBe(true);

    const [maxX, maxY] = calculateScalingCoordinates(
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER
    );
    expect(Number.isFinite(maxX)).toBe(true);
    expect(Number.isFinite(maxY)).toBe(true);
    expect(maxX).toBeCloseTo(1000);
    expect(maxY).toBeCloseTo(1000);

    const [infX, infY] = calculateScalingCoordinates(Infinity, -500);
    expect(Number.isFinite(infX)).toBe(true);
    expect(Number.isFinite(infY)).toBe(true);
    expect(infX).toBe(0);
    expect(infY).toBe(0);
  });

  it('Case 4: Verify formatting truncation structures wrap and truncate cleanly', () => {
    expect(formatLogCount(1200000)).toBe('1.2M logs');
    expect(formatLogCount(1205000)).toBe('1.2M logs');
    expect(formatLogCount(99000)).toBe('99K logs');
    expect(formatLogCount(450)).toBe('450 logs');
    expect(formatLogCount(Number.MAX_SAFE_INTEGER)).toContain('M logs');
    expect(formatLogCount(NaN)).toBe('0 logs');
  });

  it('Case 5: Ensure memory footprint serialization loops produce stable string schemas', () => {
    const tree = buildTree('root', 3, 5);
    const baseSerialized = JSON.stringify(tree);

    for (let j = 0; j < 50; j++) {
      const loopSerialized = JSON.stringify(tree);
      expect(loopSerialized).toBe(baseSerialized);

      const parsedTree = JSON.parse(loopSerialized) as MetricNode;
      expect(parsedTree.id).toBe('root');
      expect(parsedTree.children.length).toBe(5);
    }
  });
});
