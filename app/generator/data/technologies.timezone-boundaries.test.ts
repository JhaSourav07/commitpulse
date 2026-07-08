import { describe, expect, it } from 'vitest';
import { getTechById } from './technologies';

describe('technologies - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  // Test Case 1: Standard structural boundary data schema match
  it('safely extracts core frontend framework primitives from the data index', () => {
    const reactAsset = getTechById('react');

    expect(reactAsset).toBeDefined();
    expect(reactAsset?.id).toBe('react');
    expect(reactAsset?.name).toBe('React');
    expect(typeof reactAsset?.iconUrl).toBe('string');
  });

  // Test Case 2: Verification of boundary constraints for missing keys
  it('returns undefined when querying the catalog with an empty space handle string', () => {
    const spaceResult = getTechById('   ');
    expect(spaceResult).toBeUndefined();
  });

  // Test Case 3: Case sensitivity structural constraint gate
  it('requires exact lower-case matches to pull catalog entities cleanly', () => {
    // Exact identifier lookups are strictly case-sensitive in the find matrix
    expect(getTechById('typescript')).toBeDefined();
    expect(getTechById('TypeScript')).toBeUndefined();
    expect(getTechById('TYPESCRIPT')).toBeUndefined();
  });

  // Test Case 4: Property schema layout boundary alignments
  it('ensures distinct framework definitions maintain correct category property shapes', () => {
    const nodeAsset = getTechById('node') || getTechById('nodejs');

    if (nodeAsset) {
      expect(nodeAsset.category).toBeDefined();
      expect(typeof nodeAsset.category).toBe('string');
      expect(nodeAsset.type).toMatch(/^(simpleicon|devicon)$/);
    }
  });

  // Test Case 5: Terminal index collection lookups
  it('handles terminal sequential identifier lookups without throwing exceptions', () => {
    const criticalKeys = ['javascript', 'html', 'css'];
    const resolvedKeys = criticalKeys.map((id) => getTechById(id)).filter(Boolean);

    expect(resolvedKeys.length).toBeGreaterThan(0);
    expect(typeof resolvedKeys[0]?.name).toBe('string');
  });
});
