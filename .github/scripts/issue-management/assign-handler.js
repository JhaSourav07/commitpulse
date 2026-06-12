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

async function handleAssign({ github, context, username, hasWriteAccess }) {
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  const issueState = context.payload.issue.state;
  const commenter = context.payload.comment.user.login;

  if (!hasWriteAccess) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `⛔ @${commenter}, you don't have permission to use \`/assign\`. Only maintainers and collaborators with write access can assign issues.`,
    });
    return;
  }

  if (issueState === 'closed') {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Commands cannot be used on closed issues.`,
    });
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  if (!usernameRegex.test(username)) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ \`@${username}\` is not a valid GitHub username.`,
    });
    return;
  }

  try {
    await github.rest.users.getByUsername({ username });
  } catch (error) {
    if (error.status === 404) {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `❌ GitHub user \`@${username}\` does not exist. Please check the username and try again.`,
      });
      return;
    }
    throw error;
  }

  // Re-fetch to avoid stale assignee data from the webhook payload
  const { data: freshIssue } = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  const currentAssignees = freshIssue.assignees.map((a) => a.login.toLowerCase());
  if (currentAssignees.includes(username.toLowerCase())) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `ℹ️ \`@${username}\` is already assigned to this issue.`,
    });
    return;
  }

  const existingIssues = await findExistingAssignments(github, owner, repo, username, issueNumber);
  if (existingIssues.length >= MAX_ASSIGNED_ISSUES) {
    const issueList = existingIssues
      .map((i) => `> 📋 [#${i.number} — ${i.title}](${i.html_url})`)
      .join('\n');
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ @${username} already has **${existingIssues.length}/${MAX_ASSIGNED_ISSUES}** active assigned issues (the maximum allowed).\nPlease complete or unassign one of their current issues first.\n\n${issueList}`,
    });
    return;
  }

  await github.rest.issues.addAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [username],
  });

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `✅ Successfully assigned issue to @${username}\n\n> 💡 Please read [CONTRIBUTING.md](../blob/main/CONTRIBUTING.md) if you haven't already. Good luck! 🚀`,
  });
}

module.exports = { handleAssign };
