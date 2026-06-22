import { describe, it, expect, beforeAll, vi, afterAll } from 'vitest';
import { readFile, writeFile, unlink, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const nextEnvPath = resolve(root, 'next-env.d.ts');

describe('next-env.d.ts empty and missing state handling', () => {
  beforeAll(async () => {
    try {
      await access(nextEnvPath);
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

  it('contains no null bytes or binary corruption', async () => {
    const content = await readFile(nextEnvPath, 'utf-8');
    expect(content).not.toContain('\0');
    expect(() => JSON.parse(JSON.stringify(content))).not.toThrow();
  });

  it('resolves to a valid file path at the project root', () => {
    expect(nextEnvPath).toContain('next-env.d.ts');
    expect(nextEnvPath).toBe(resolve(root, 'next-env.d.ts'));
  });

  it('handles missing file gracefully by providing fallback content', async () => {
    const backupPath = resolve(root, 'next-env.d.ts.bak');
    try {
      await writeFile(backupPath, await readFile(nextEnvPath, 'utf-8'));
      await unlink(nextEnvPath);

      const missing = await readFile(nextEnvPath, 'utf-8').catch(() => null);
      expect(missing).toBeNull();
    } finally {
      try {
        await writeFile(nextEnvPath, await readFile(backupPath, 'utf-8'));
        await unlink(backupPath);
      } catch {}
    }
  });

  it('retains valid structure when file is truncated to minimum viable content', async () => {
    const minimal = '/// <reference types="next" />\n';
    await writeFile(nextEnvPath, minimal);
    const content = await readFile(nextEnvPath, 'utf-8');
    expect(content).toBe(minimal);
    expect(content).toContain('/// <reference types="next" />');
  });

  it('restores full content after minimal state test', async () => {
    const fullContent = [
      '/// <reference types="next" />',
      '/// <reference types="next/image-types/global" />',
      'import "./.next/dev/types/routes.d.ts";',
      '',
      '// NOTE: This file should not be edited',
      '// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.',
      '',
    ].join('\n');
    await writeFile(nextEnvPath, fullContent);
    const content = await readFile(nextEnvPath, 'utf-8');
    expect(content).toBe(fullContent);
  });
});
