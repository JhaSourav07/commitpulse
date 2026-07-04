import { describe, expect, it } from 'vitest';
import { buildGitCloneInvocation } from './git-clone';

describe('buildGitCloneInvocation', () => {
  it('never embeds credentials in the clone URL', () => {
    const { command, args } = buildGitCloneInvocation(
      'octocat',
      'hello-world',
      '/tmp/dest',
      'ghp_secret_token'
    );

    expect(command).toBe('git');
    expect(args).toEqual([
      '-c',
      'http.extraHeader=Authorization: Bearer ghp_secret_token',
      'clone',
      '--depth',
      '1',
      '--',
      'https://github.com/octocat/hello-world.git',
      '/tmp/dest',
    ]);

    const cloneUrlArg = args[6];
    expect(cloneUrlArg).not.toContain('ghp_secret_token');
    expect(cloneUrlArg).not.toMatch(/x-access-token:/);
    expect(cloneUrlArg).not.toContain('@github.com');
  });

  it('builds unauthenticated clone commands for public repositories', () => {
    const { command, args } = buildGitCloneInvocation('octocat', 'hello-world', '/tmp/dest');

    expect(command).toBe('git');
    expect(args).toEqual([
      'clone',
      '--depth',
      '1',
      '--',
      'https://github.com/octocat/hello-world.git',
      '/tmp/dest',
    ]);
  });
});
