import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import type { Technology } from '../types';
import { TECHNOLOGIES, TECH_CATEGORIES, getTechById } from './technologies';

describe('Technologies Massive Data Sets and Extreme High Bounds Scaling', () => {
  // Test 1 — Bulk lookup throughput under high call volume
  it('completes 10,000 getTechById lookups within 1500ms', () => {
    const ids = TECHNOLOGIES.map((t) => t.id);
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      const id = ids[i % ids.length];
      const result = getTechById(id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1500); // Relaxed threshold to avoid flakiness in slow CI environments
  });

  // Test 2 — Category grouping scales correctly over a massively duplicated dataset
  it('groups 5,000 synthetic entries by category without missing or undefined buckets', () => {
    const massive = Array.from({ length: 5000 }, (_, i) => ({
      ...TECHNOLOGIES[i % TECHNOLOGIES.length],
      id: `tech-${i}`,
    }));
    const grouped = massive.reduce<Record<string, Technology[]>>((acc, t) => {
      (acc[t.category] ??= []).push(t);
      return acc;
    }, {});
    TECH_CATEGORIES.forEach((cat) => {
      const bucket = grouped[cat];
      expect(bucket).toBeDefined();
      expect(bucket?.length).toBeGreaterThan(0);
    });
    expect(Object.keys(grouped).length).toBe(TECH_CATEGORIES.length);
  });

  // Test 3 — ID uniqueness holds when the dataset is replicated at extreme bounds
  it('preserves ID uniqueness across source data and 50,000 generated entries', () => {
    // 1. Verify original source ID uniqueness
    const sourceIds = TECHNOLOGIES.map((t) => t.id);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);

    // 2. Verify replicated ID uniqueness with indexed suffixes
    const massive = Array.from({ length: 50_000 }, (_, i) => ({
      ...TECHNOLOGIES[i % TECHNOLOGIES.length],
      id: `${TECHNOLOGIES[i % TECHNOLOGIES.length].id}-${i}`,
    }));
    const ids = massive.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Test 4 — iconUrl integrity holds for all entries in a 10,000-entry synthetic list
  it('ensures all iconUrls are valid https URLs across 10,000 synthetic entries', () => {
    const massive = Array.from({ length: 10_000 }, (_, i) => ({
      ...TECHNOLOGIES[i % TECHNOLOGIES.length],
      id: `icon-check-${i}`,
    }));
    massive.forEach((t) => {
      expect(t.iconUrl).toBeTruthy();
      expect(t.iconUrl.startsWith('https://')).toBe(true);
    });
  });

  // Test 5 — Multi-filter pipeline (filter + sort + map) completes within time bounds on a 20,000-entry dataset
  it('filters, sorts, and maps 20,000 entries by category within 1000ms', () => {
    const targetCategory = TECHNOLOGIES[0]?.category || 'Languages';

    const massive = Array.from({ length: 20_000 }, (_, i) => ({
      ...TECHNOLOGIES[i % TECHNOLOGIES.length],
      id: `pipeline-${i}`,
    }));
    const start = performance.now();
    const result = massive
      .filter((t) => t.category === targetCategory)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => t.id);
    const elapsed = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1000); // Relaxed threshold to avoid flakiness in slow CI environments

    // Build map for O(1) lookup to keep the verification O(N) instead of O(N^2)
    const nameMap = new Map<string, string>();
    massive.forEach((t) => {
      nameMap.set(t.id, t.name);
    });

    // verify sort order
    for (let i = 1; i < result.length; i++) {
      const prev = nameMap.get(result[i - 1])!;
      const curr = nameMap.get(result[i])!;
      expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
    }
  });
});
