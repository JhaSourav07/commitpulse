import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker Multi-Stage Containerization Setup', () => {
  const rootDir = path.resolve(__dirname, '..');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const dockerignorePath = path.join(rootDir, '.dockerignore');
  const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
  const nextConfigPath = path.join(rootDir, 'next.config.ts');

  it('should have Dockerfile configured with multi-stage build stages', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    // Multi-stage stages
    expect(content).toMatch(/FROM\s+node:22-alpine\s+AS\s+base/i);
    expect(content).toMatch(/FROM\s+base\s+AS\s+deps/i);
    expect(content).toMatch(/FROM\s+base\s+AS\s+builder/i);
    expect(content).toMatch(/FROM\s+node:22-alpine\s+AS\s+runner/i);
  });

  it('should include necessary Alpine compatibility libraries and environment variables', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    expect(content).toContain('libc6-compat');
    expect(content).toContain('ENV HOSTNAME="0.0.0.0"');
    expect(content).toContain('ENV NODE_ENV=production');
    expect(content).toContain('ENV NEXT_TELEMETRY_DISABLED=1');
  });

  it('should run as non-root user for security compliance', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    expect(content).toContain('addgroup');
    expect(content).toContain('adduser');
    expect(content).toContain('USER nextjs');
  });

  it('should leverage Next.js standalone build artifacts', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    expect(content).toContain('.next/standalone');
    expect(content).toContain('.next/static');
    expect(content).toContain('public');
  });

  it('should exclude unnecessary build files and secrets in .dockerignore', () => {
    expect(fs.existsSync(dockerignorePath)).toBe(true);
    const content = fs.readFileSync(dockerignorePath, 'utf-8');

    expect(content).toContain('node_modules');
    expect(content).toContain('.next');
    expect(content).toContain('.git');
    expect(content).toContain('.env*.local');
    expect(content).toContain('coverage');
  });

  it('should target the runner stage in docker-compose.yml', () => {
    expect(fs.existsSync(dockerComposePath)).toBe(true);
    const content = fs.readFileSync(dockerComposePath, 'utf-8');

    expect(content).toContain('dockerfile: Dockerfile');
    expect(content).toContain('target: runner');
  });

  it('should have next.config.ts set to standalone output mode', () => {
    expect(fs.existsSync(nextConfigPath)).toBe(true);
    const content = fs.readFileSync(nextConfigPath, 'utf-8');

    expect(content).toContain("output: 'standalone'");
  });
});
