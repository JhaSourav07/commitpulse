import type { ApiField } from './extractBadgeParams';

export type ChangeKind =
  | 'field-removed'
  | 'field-now-required'
  | 'field-type-narrowed'
  | 'field-added'
  | 'field-now-optional'
  | 'field-type-widened';

export interface ApiChange {
  kind: ChangeKind;
  field: string;
  detail: string;
  breaking: boolean;
}

export interface BreakingChangeReport {
  changes: ApiChange[];
  breakingChanges: ApiChange[];
  recommendedBump: 'major' | 'minor' | 'patch';
}

/**
 * Compares two snapshots of the `BadgeParams` interface (typically "base
 * branch" vs "this PR") and classifies every difference against semver
 * rules for a consumer-facing query-parameter API:
 *
 * - Removing a field, or turning an optional field required, breaks any
 *   existing README embed URL that omits it → MAJOR.
 * - Narrowing a field's type (e.g. `string` -> `'a' | 'b'`) can reject
 *   previously-valid values → MAJOR.
 * - Adding a new optional field, or relaxing required -> optional, is
 *   backward compatible → MINOR.
 * - No field changes → PATCH.
 *
 * This directly targets the gap described in the "commit analysis not
 * capturing breaking changes" issue: there was no automated way to know
 * whether a change to the public badge API required a major version bump
 * before it shipped.
 */
export function detectBreakingChanges(
  baseFields: ApiField[],
  currentFields: ApiField[]
): BreakingChangeReport {
  const baseByName = new Map(baseFields.map((f) => [f.name, f]));
  const currentByName = new Map(currentFields.map((f) => [f.name, f]));

  const changes: ApiChange[] = [];

  for (const [name, baseField] of baseByName) {
    const currentField = currentByName.get(name);

    if (!currentField) {
      changes.push({
        kind: 'field-removed',
        field: name,
        detail: `'${name}' was removed from the public API. Any existing badge URL using ?${name}= will silently drop that parameter.`,
        breaking: true,
      });
      continue;
    }

    if (!baseField.optional && currentField.optional) {
      changes.push({
        kind: 'field-now-optional',
        field: name,
        detail: `'${name}' changed from required to optional.`,
        breaking: false,
      });
    } else if (baseField.optional && !currentField.optional) {
      changes.push({
        kind: 'field-now-required',
        field: name,
        detail: `'${name}' changed from optional to required. Existing URLs that omit it will now fail validation.`,
        breaking: true,
      });
    }

    if (baseField.typeText !== currentField.typeText) {
      const narrowed = isTypeNarrowed(baseField.typeText, currentField.typeText);
      changes.push({
        kind: narrowed ? 'field-type-narrowed' : 'field-type-widened',
        field: name,
        detail: `'${name}' type changed from \`${baseField.typeText}\` to \`${currentField.typeText}\`.`,
        breaking: narrowed,
      });
    }
  }

  for (const [name] of currentByName) {
    if (!baseByName.has(name)) {
      changes.push({
        kind: 'field-added',
        field: name,
        detail: `'${name}' was added to the public API.`,
        breaking: false,
      });
    }
  }

  const breakingChanges = changes.filter((c) => c.breaking);
  const hasNonBreakingChange = changes.length > 0 && breakingChanges.length === 0;

  const recommendedBump: BreakingChangeReport['recommendedBump'] =
    breakingChanges.length > 0 ? 'major' : hasNonBreakingChange ? 'minor' : 'patch';

  return { changes, breakingChanges, recommendedBump };
}

/**
 * Heuristic for whether a type change narrows (restricts) the accepted
 * value set, which would reject previously-valid caller input.
 *
 * A widened union (base is a strict subset of current) is safe. Anything
 * else — base was a primitive/wider type and current is a narrower union,
 * or the union shrank — is treated as a narrowing (breaking) change, since
 * we cannot prove it's safe without full type-checker cross-referencing.
 */
function isTypeNarrowed(baseType: string, currentType: string): boolean {
  const baseUnion = splitUnion(baseType);
  const currentUnion = splitUnion(currentType);

  // Widening: every base member still accepted by current (base subset of current).
  const isWidening = baseUnion.every((member) => currentUnion.includes(member));
  if (isWidening) return false;

  return true;
}

function splitUnion(typeText: string): string[] {
  return typeText
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}
