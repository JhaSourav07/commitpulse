import 'server-only';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFilePromise = promisify(execFile);

/**
 * Builds the command and arguments for a shallow git clone of a GitHub repository.
 *
 * Credentials are never embedded in the clone URL. When a token is provided it is
 * passed via `git -c http.extraHeader=...` to prevent the token from appearing in
 * process argument lists or repository URLs stored in `.git/config`.
 *
 * @param owner - The GitHub repository owner
 * @param repo - The repository name
 * @param destDir - The destination directory for the clone
 * @param token - Optional GitHub personal access token for private repositories
 * @returns An object containing the git command and its arguments array
 */
export function buildGitCloneInvocation(
  owner: string,
  repo: string,
  destDir: string,
  token?: string
): { command: string; args: string[] } {
  const cloneUrl = `https://github.com/${owner}/${repo}.git`;
  const baseArgs = ['clone', '--depth', '1', '--', cloneUrl, destDir];

  if (token) {
    return {
      command: 'git',
      args: ['-c', `http.extraHeader=Authorization: Bearer ${token}`, ...baseArgs],
    };
  }

  return { command: 'git', args: baseArgs };
}

/**
 * Shallow-clones a GitHub repository without embedding credentials in the clone URL.
 * When a token is provided, it is passed via git http.extraHeader instead.
 */
export async function cloneGitHubRepository(
  owner: string,
  repo: string,
  destDir: string,
  token?: string
): Promise<void> {
  const { command, args } = buildGitCloneInvocation(owner, repo, destDir, token);
  const gitEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  await execFilePromise(command, args, { env: gitEnv });
}
