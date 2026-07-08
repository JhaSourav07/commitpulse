import ts from 'typescript';

/**
 * A single field of the public `BadgeParams` API contract, extracted from
 * the TypeScript AST rather than parsed with regex, so renames/reordering
 * inside the interface body can't silently break detection.
 */
export interface ApiField {
  name: string;
  optional: boolean;
  typeText: string;
}

/**
 * Parses TypeScript source text and extracts every member of the named
 * interface as an `ApiField`. Used to snapshot the public `BadgeParams`
 * contract at a given commit so two snapshots can be diffed for breaking
 * changes (see `detectBreakingChanges.ts`).
 *
 * Returns an empty array if the interface is not found in the source,
 * rather than throwing, so callers can distinguish "interface deleted
 * entirely" (an empty snapshot, itself a breaking change) from a parse error.
 */
export function extractInterfaceFields(sourceText: string, interfaceName: string): ApiField[] {
  const sourceFile = ts.createSourceFile(
    'source.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const fields: ApiField[] = [];

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const name = member.name.getText(sourceFile);
          const optional = member.questionToken !== undefined;
          const typeText = member.type ? member.type.getText(sourceFile) : 'unknown';
          fields.push({ name, optional, typeText });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return fields;
}
