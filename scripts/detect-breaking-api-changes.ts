/**
 * CLI: detect breaking changes to the public `BadgeParams` API contract
 * between two git refs, and recommend a semver bump.
 *
 * Usage:
 *   tsx scripts/detect-breaking-api-changes.ts [baseRef] [headRef]
 *
 * Defaults to comparing `origin/main` against the current working tree,
 * so it can be run locally before opening a PR, or in CI comparing the
 * PR's base ref against its head ref.
 *
 * Exits with code 1 if any breaking change is detected, so it can gate CI.
 */
import { execSync } from 'child_process';
import { extractInterfaceFields } from '../lib/api-contract/extractBadgeParams';
import { detectBreakingChanges } from '../lib/api-contract/detectBreakingChanges';

const TYPES_FILE = 'types/index.ts';
const INTERFACE_NAME = 'BadgeParams';

function readFileAtRef(ref: string, filePath: string): string {
  return execSync(`git show ${ref}:${filePath}`, { encoding: 'utf-8' });
}

function readWorkingTreeFile(filePath: string): string {
  return execSync(`cat ${filePath}`, { encoding: 'utf-8' });
}

function main() {
  const baseRef = process.argv[2] || 'origin/main';
  const headRef = process.argv[3];

  const baseSource = readFileAtRef(baseRef, TYPES_FILE);
  const headSource = headRef ? readFileAtRef(headRef, TYPES_FILE) : readWorkingTreeFile(TYPES_FILE);

  const baseFields = extractInterfaceFields(baseSource, INTERFACE_NAME);
  const currentFields = extractInterfaceFields(headSource, INTERFACE_NAME);

  const report = detectBreakingChanges(baseFields, currentFields);

  console.log(`\nAPI contract comparison: ${baseRef} -> ${headRef || 'working tree'}`);
  console.log(`Interface: ${INTERFACE_NAME} (${TYPES_FILE})\n`);

  if (report.changes.length === 0) {
    console.log('No changes detected in the public BadgeParams contract.');
    console.log('Recommended version bump: patch\n');
    return;
  }

  for (const change of report.changes) {
    const tag = change.breaking ? '[BREAKING]' : '[safe]';
    console.log(`${tag} ${change.detail}`);
  }

  console.log(`\nRecommended version bump: ${report.recommendedBump}\n`);

  if (report.breakingChanges.length > 0) {
    console.error(
      `${report.breakingChanges.length} breaking change(s) detected in the public API. ` +
        `This PR should bump the MAJOR version and document the change in CHANGELOG.md.`
    );
    process.exitCode = 1;
  }
}

main();
