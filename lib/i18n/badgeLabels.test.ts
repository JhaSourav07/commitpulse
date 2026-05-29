import { describe, it, expect } from 'vitest';
import { getLabels } from './badgeLabels';

describe('getLabels', () => {
  describe('COMMITS_THIS_MONTH', () => {
    it('returns correct label for en', () => {
      expect(getLabels('en').COMMITS_THIS_MONTH).toBe('COMMITS THIS MONTH');
    });

    it('returns correct label for es', () => {
      expect(getLabels('es').COMMITS_THIS_MONTH).toBe('COMMITS ESTE MES');
    });

    it('returns correct label for de', () => {
      expect(getLabels('de').COMMITS_THIS_MONTH).toBe('COMMITS DIESEN MONAT');
    });

    it('returns correct label for ja', () => {
      expect(getLabels('ja').COMMITS_THIS_MONTH).toBe('今月のコミット数');
    });
  });
});
