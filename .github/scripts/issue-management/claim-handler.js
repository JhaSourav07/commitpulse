async function findExistingAssignments(github, owner, repo, username, currentIssueNumber) {
  const { data: issues } = await github.rest.issues.listForRepo({
    owner,
    repo,
    assignee: username,
    state: 'open',
    per_page: 100,
  });

  return issues.filter((issue) => !issue.pull_request && issue.number !== currentIssueNumber);
}

const MAX_ASSIGNED_ISSUES = 5;

async function handleClaim({ github, context }) {
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  const issueState = context.payload.issue.state;
  const commenter = context.payload.comment.user.login;

  if (issueState === 'closed') {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Commands cannot be used on closed issues.`,
    });
    return;
  }

  // Re-fetch to avoid stale issue/assignee/state data from the webhook payload
  const { data: freshIssue } = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  const currentAssignees = freshIssue.assignees.map((a) => a.login.toLowerCase());

  if (currentAssignees.length > 0) {
    if (currentAssignees.includes(commenter.toLowerCase())) {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `ℹ️ You are already assigned to this issue.`,
      });
      return;
    }
    const assigneeList = currentAssignees.map((a) => `@${a}`).join(', ');
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ This issue is already assigned to ${assigneeList}`,
    });
    return;
  }

  const issueAuthor = freshIssue.user.login;
  const issueAuthorLower = issueAuthor.toLowerCase();
  const commenterLower = commenter.toLowerCase();

  const MAINTAINERS = ['jhasourav07', 'aamod-dev', 'souravjhahind'];
  const isOpenedByMaintainer = MAINTAINERS.includes(issueAuthorLower);

  // Check if the issue is older than 1 week (7 days)
  const createdAt = new Date(freshIssue.created_at);
  const now = new Date();
  const ageInMs = now.getTime() - createdAt.getTime();
  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
  const isOlderThanOneWeek = ageInMs > oneWeekInMs;

  // Check if opened by any other person other than jhasourav07 or aamod007 (and aamod-dev for safety)
  const isOpenedByOther = !['jhasourav07', 'aamod007', 'aamod-dev'].includes(issueAuthorLower);

  const isAuthor = commenterLower === issueAuthorLower;
  const canClaimOlderIssue = isOpenedByOther && isOlderThanOneWeek;

  const isAllowedToClaim = isAuthor || isOpenedByMaintainer || canClaimOlderIssue;

  if (!isAllowedToClaim) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Only the author of this issue (@${issueAuthor}) can claim it.`,
    });
    return;
  }

  const existingIssues = await findExistingAssignments(github, owner, repo, commenter, issueNumber);
  if (existingIssues.length >= MAX_ASSIGNED_ISSUES) {
    const issueList = existingIssues
      .map((i) => `> 📋 [#${i.number} — ${i.title}](${i.html_url})`)
      .join('\n');
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ You already have **${existingIssues.length}/${MAX_ASSIGNED_ISSUES}** active assigned issues (the maximum allowed).\nPlease complete or \`/unclaim\` one of your current issues before claiming another.\n\n${issueList}`,
    });
    return;
  }

  await github.rest.issues.addAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [commenter],
  });

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `🎉 **Assigned!** Welcome to the project, @${commenter}.\n\n⏳ **Reminder:** You have **2 days** to submit a Pull Request. After 2 days of inactivity, you will be automatically unassigned to give others a chance (as per our GSSoC anti-hoarding policy).\n\n> 💡 Please read [CONTRIBUTING.md](../blob/main/CONTRIBUTING.md) if you haven't already.\n\nHappy coding! 🚀`,
  });
}

module.exports = { handleClaim };
