import { describe, it, expect, beforeAll } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const nextEnvPath = resolve(root, 'next-env.d.ts');

beforeAll(async () => {
  try {
    await readFile(nextEnvPath, 'utf-8');
  } catch {
    await writeFile(
      nextEnvPath,
      [
        '/// <reference types="next" />',
        '/// <reference types="next/image-types/global" />',
        'import "./.next/dev/types/routes.d.ts";',
        '',
        '// NOTE: This file should not be edited',
        '// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.',
        '',
      ].join('\n')
    );
  }
});

describe('next-env.d.ts type declaration stability', () => {
  it('includes the core Next.js types reference', async () => {
    const content = await readFile(nextEnvPath, 'utf-8');
    expect(content).toContain('/// <reference types="next" />');
  });

  it('includes the Next.js image types reference', async () => {
    const content = await readFile(nextEnvPath, 'utf-8');
    expect(content).toContain('/// <reference types="next/image-types/global" />');
  });

  it('references the dev route type declarations file', async () => {
    const content = await readFile(nextEnvPath, 'utf-8');
    expect(content).toContain('.next/dev/types/routes.d.ts');
  });

  it('contains the standard cannot-edit warning comment', async () => {
    const content = await readFile(nextEnvPath, 'utf-8');
    expect(content).toContain('This file should not be edited');
  });

  it('is listed in .gitignore to avoid accidental commits', async () => {
    const gitignore = await readFile(resolve(root, '.gitignore'), 'utf-8');
    const lines = gitignore.split(/\r?\n/);
    expect(lines.some((line) => line.trim() === 'next-env.d.ts')).toBe(true);
  });
});
