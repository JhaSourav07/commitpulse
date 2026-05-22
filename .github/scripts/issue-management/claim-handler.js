async function findExistingAssignment(github, owner, repo, username, currentIssueNumber) {
  const { data: issues } = await github.rest.issues.listForRepo({
    owner,
    repo,
    assignee: username,
    state: 'open',
    per_page: 100,
  });

  const assignedIssues = issues.filter(
    (issue) => !issue.pull_request && issue.number !== currentIssueNumber
  );

  return assignedIssues.length > 0 ? assignedIssues[0] : null;
}

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

  const issueAuthor = context.payload.issue.user.login;

  if (commenter.toLowerCase() !== issueAuthor.toLowerCase()) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Only the author of this issue (@${issueAuthor}) can claim it.`,
    });
    return;
  }

  const currentAssignees = context.payload.issue.assignees.map((a) => a.login.toLowerCase());

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

  const existingIssue = await findExistingAssignment(github, owner, repo, commenter, issueNumber);
  if (existingIssue) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ You already have an active assigned issue.\nPlease complete or unassign your current issue first.\n\n> 📋 Active issue: [#${existingIssue.number} — ${existingIssue.title}](${existingIssue.html_url})`,
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
    body: `✅ Successfully assigned issue to @${commenter}\n\n> 💡 Please read [CONTRIBUTING.md](../blob/main/CONTRIBUTING.md) if you haven't already. Good luck! 🚀`,
  });
}

module.exports = { handleClaim };
