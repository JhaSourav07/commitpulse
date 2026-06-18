import { afterEach, describe, expect, it, vi } from 'vitest';

const { handleClaim } = require('./claim-handler');

function createGithubMock(freshIssue: Record<string, unknown>) {
  return {
    rest: {
      issues: {
        addAssignees: vi.fn().mockResolvedValue({}),
        createComment: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({ data: freshIssue }),
        listForRepo: vi.fn().mockResolvedValue({ data: [] }),
      },
    },
  };
}

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    repo: { owner: 'JhaSourav07', repo: 'commitpulse' },
    payload: {
      issue: {
        number: 123,
        state: 'open',
        user: { login: 'issue-author' },
        created_at: '2026-06-10T00:00:00.000Z',
        ...overrides,
      },
      comment: {
        user: { login: 'new-contributor' },
      },
    },
  };
}

describe('handleClaim', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('allows another contributor to claim an old unassigned issue', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T00:00:00.000Z'));

    const github = createGithubMock({
      assignees: [],
      created_at: '2026-06-10T00:00:00.000Z',
    });

    await handleClaim({
      github,
      context: createContext(),
    });

    expect(github.rest.issues.addAssignees).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      assignees: ['new-contributor'],
    });
    expect(github.rest.issues.createComment).not.toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Only the author'),
      })
    );
  });

  it('still blocks another contributor from claiming a fresh contributor-created issue', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T12:00:00.000Z'));

    const github = createGithubMock({
      assignees: [],
      created_at: '2026-06-10T00:00:00.000Z',
    });

    await handleClaim({
      github,
      context: createContext(),
    });

    expect(github.rest.issues.addAssignees).not.toHaveBeenCalled();
    expect(github.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      body: '❌ Only the author of this issue (@issue-author) can claim it.',
    });
  });
});
