import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_DIRS = ['lib', 'app', 'hooks', 'components', 'services', 'utils'];

function stripComments(code: string): string {
  return code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function walkSourceFiles(dir: string): string[] {
  const result: string[] = [];
  if (!fs.existsSync(dir)) return result;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '__tests__') {
        result.push(...walkSourceFiles(fullPath));
      }
    } else if (
      entry.isFile() &&
      /\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      result.push(fullPath);
    }
  }
  return result;
}

describe('structuredClone regression prevention', () => {
  const sourceFiles = SOURCE_DIRS.flatMap((d) => walkSourceFiles(path.join(ROOT, d)));

  it('no source file uses JSON.parse(JSON.stringify(...)) as a deep clone', () => {
    const deepCloneRe = /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/;

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const code = stripComments(content);

      if (deepCloneRe.test(code)) {
        throw new Error(
          `Found JSON.parse(JSON.stringify(...)) deep clone in ${path.relative(ROOT, file)} — use structuredClone instead`
        );
      }
    }
  });
});
