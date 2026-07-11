import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleClaim } from '../.github/scripts/issue-management/claim-handler';

interface MockGithub {
  rest: {
    issues: {
      get: ReturnType<typeof vi.fn>;
      createComment: ReturnType<typeof vi.fn>;
      addAssignees: ReturnType<typeof vi.fn>;
      listForRepo: ReturnType<typeof vi.fn>;
    };
  };
}

interface MockContext {
  repo: {
    owner: string;
    repo: string;
  };
  payload: {
    issue: {
      number: number;
      state: string;
      user: {
        login: string;
      };
      created_at?: string;
      assignees?: { login: string }[];
    };
    comment: {
      user: {
        login: string;
      };
    };
  };
}

describe('handleClaim', () => {
  let mockGithub: MockGithub;
  let mockContext: MockContext;

  beforeEach(() => {
    mockGithub = {
      rest: {
        issues: {
          get: vi.fn(),
          createComment: vi.fn(),
          addAssignees: vi.fn(),
          listForRepo: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    mockContext = {
      repo: {
        owner: 'JhaSourav07',
        repo: 'commitpulse',
      },
      payload: {
        issue: {
          number: 123,
          state: 'open',
          user: {
            login: 'someone',
          },
        },
        comment: {
          user: {
            login: 'commenter',
          },
        },
      },
    };
  });

  it('rejects if issue is closed', async () => {
    mockContext.payload.issue.state = 'closed';

    await handleClaim({ github: mockGithub, context: mockContext });

    expect(mockGithub.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      body: '❌ Commands cannot be used on closed issues.',
    });
    expect(mockGithub.rest.issues.get).not.toHaveBeenCalled();
  });

  it('allows claim if commenter is the author', async () => {
    mockContext.payload.issue.user.login = 'author1';
    mockContext.payload.comment.user.login = 'author1';

    // Mock freshIssue fetch
    mockGithub.rest.issues.get.mockResolvedValue({
      data: {
        created_at: new Date().toISOString(),
        assignees: [],
        user: { login: 'author1' },
      },
    });

    await handleClaim({ github: mockGithub, context: mockContext });

    expect(mockGithub.rest.issues.addAssignees).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      assignees: ['author1'],
    });
  });

  it('allows claim if issue was opened by a maintainer', async () => {
    mockContext.payload.issue.user.login = 'jhasourav07';
    mockContext.payload.comment.user.login = 'anyone';

    mockGithub.rest.issues.get.mockResolvedValue({
      data: {
        created_at: new Date().toISOString(),
        assignees: [],
        user: { login: 'jhasourav07' },
      },
    });

    await handleClaim({ github: mockGithub, context: mockContext });

    expect(mockGithub.rest.issues.addAssignees).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      assignees: ['anyone'],
    });
  });

  it('rejects claim if issue is less than 1 week old and commenter is not author/maintainer', async () => {
    mockContext.payload.issue.user.login = 'somebody';
    mockContext.payload.comment.user.login = 'anyone';

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    mockGithub.rest.issues.get.mockResolvedValue({
      data: {
        created_at: fiveDaysAgo.toISOString(),
        assignees: [],
        user: { login: 'somebody' },
      },
    });

    await handleClaim({ github: mockGithub, context: mockContext });

    expect(mockGithub.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      body: '❌ Only the author of this issue (@somebody) can claim it.',
    });
  });

  it('allows claim if issue is older than 1 week and opened by anyone other than maintainer/jhasourav07/aamod007', async () => {
    mockContext.payload.issue.user.login = 'somebody';
    mockContext.payload.comment.user.login = 'anyone';

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    mockGithub.rest.issues.get.mockResolvedValue({
      data: {
        created_at: tenDaysAgo.toISOString(),
        assignees: [],
        user: { login: 'somebody' },
      },
    });

    await handleClaim({ github: mockGithub, context: mockContext });

    expect(mockGithub.rest.issues.addAssignees).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      assignees: ['anyone'],
    });
  });

  it('rejects claim for older issue if opened by jhasourav07 or aamod007 but commenter is not author', async () => {
    mockContext.payload.issue.user.login = 'aamod007';
    mockContext.payload.comment.user.login = 'anyone';

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    mockGithub.rest.issues.get.mockResolvedValue({
      data: {
        created_at: tenDaysAgo.toISOString(),
        assignees: [],
        user: { login: 'aamod007' },
      },
    });

    await handleClaim({ github: mockGithub, context: mockContext });

    expect(mockGithub.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      body: '❌ Only the author of this issue (@aamod007) can claim it.',
    });
  });

  it('rejects claim if issue is already assigned', async () => {
    mockContext.payload.issue.user.login = 'somebody';
    mockContext.payload.comment.user.login = 'anyone';

    mockGithub.rest.issues.get.mockResolvedValue({
      data: {
        created_at: new Date().toISOString(),
        assignees: [{ login: 'assigned_user' }],
        user: { login: 'somebody' },
      },
    });

    await handleClaim({ github: mockGithub, context: mockContext });

    expect(mockGithub.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'JhaSourav07',
      repo: 'commitpulse',
      issue_number: 123,
      body: '❌ This issue is already assigned to @assigned_user',
    });
  });
});
