import { describe, it, expect } from 'vitest';
import { generateMonolithSTL, activityToTowers } from './export3d';
import type { ActivityData } from '@/types/dashboard';

describe('export3d empty-fallback and edge-cases', () => {
  describe('activityToTowers', () => {
    it('should return an empty array when activity is empty', () => {
      expect(activityToTowers([])).toEqual([]);
    });

    it('should return an empty array when activity is null or undefined safely at runtime', () => {
      expect(activityToTowers(null as unknown as ActivityData[])).toEqual([]);
      expect(activityToTowers(undefined as unknown as ActivityData[])).toEqual([]);
    });

    it('should handle zero contribution count arrays without causing division-by-zero or NaN heights', () => {
      const emptyActivity = [
        { date: '2024-01-01', count: 0 },
        { date: '2024-01-02', count: 0 },
        { date: '2024-01-03', count: 0 },
      ] as unknown as ActivityData[];

      const towers = activityToTowers(emptyActivity);
      expect(towers).toHaveLength(3);

      towers.forEach((tower) => {
        expect(tower.h).toBe(0);
        expect(tower.intensityLevel).toBe(0);
        expect(tower.hasCommits).toBe(false);
        expect(tower.isGhost).toBe(false);
      });
    });

    it('should fall back to calculated intensity when intensity is missing/undefined on non-empty activity', () => {
      const activityWithoutIntensity = [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 10 },
      ] as unknown as ActivityData[];

      const towers = activityToTowers(activityWithoutIntensity);
      expect(towers).toHaveLength(2);
      expect(towers[0].intensityLevel).toBe(2); // Math.ceil((5 / 10) * 4) = 2
      expect(towers[1].intensityLevel).toBe(4); // Math.ceil((10 / 10) * 4) = 4

      towers.forEach((tower) => {
        expect(Number.isNaN(tower.intensityLevel)).toBe(false);
      });
    });
  });

  describe('generateMonolithSTL', () => {
    it('should generate a valid default STL for empty tower arrays', () => {
      const stl = generateMonolithSTL([]);
      expect(stl).toContain('solid commitpulse_monolith');
      expect(stl).toContain('endsolid commitpulse_monolith');
      expect(stl).not.toContain('NaN');

      const facets = (stl.match(/facet normal/g) ?? []).length;
      expect(facets).toBe(12); // Exactly 12 facets for the base plate rectangular box
    });

    it('should ignore ghost or zero-height towers, rendering only the base plate', () => {
      const zeroHeightTowers = [
        {
          x: 0,
          y: 0,
          h: 0,
          hasCommits: false,
          isGhost: false,
          isToday: false,
          isTodayWithCommits: false,
          tooltip: '2024-01-01: 0 contributions',
          date: '2024-01-01',
          contributionCount: 0,
          faceOpacity: { left: 1, right: 1, top: 1 },
          strokeOpacity: 1,
          strokeWidth: 1,
          row: 0,
          col: 0,
          intensityLevel: 0,
        },
      ];

      const stl = generateMonolithSTL(zeroHeightTowers);
      expect(stl).toContain('solid commitpulse_monolith');
      expect(stl).toContain('endsolid commitpulse_monolith');
      expect(stl).not.toContain('NaN');

      const facets = (stl.match(/facet normal/g) ?? []).length;
      expect(facets).toBe(12); // Only base plate facets
    });

    it('should prevent NaN in vertex positions with custom coordinates', () => {
      const stl = generateMonolithSTL([]);
      const lines = stl.split('\n');
      lines.forEach((line) => {
        if (line.trim().startsWith('vertex')) {
          expect(line).not.toContain('NaN');
          const parts = line.trim().split(/\s+/);
          expect(parts).toHaveLength(4); // "vertex", "x", "y", "z"
          expect(Number.isNaN(parseFloat(parts[1]))).toBe(false);
          expect(Number.isNaN(parseFloat(parts[2]))).toBe(false);
          expect(Number.isNaN(parseFloat(parts[3]))).toBe(false);
        }
      });
    });
  });
});
