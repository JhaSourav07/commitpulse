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

  const currentAssignees = context.payload.issue.assignees.map((a) => a.login.toLowerCase());
  if (currentAssignees.includes(username.toLowerCase())) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `ℹ️ \`@${username}\` is already assigned to this issue.`,
    });
    return;
  }

  const existingIssue = await findExistingAssignment(github, owner, repo, username, issueNumber);
  if (existingIssue) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ @${username} already has an active assigned issue.\nPlease complete or unassign the current issue first.\n\n> 📋 Active issue: [#${existingIssue.number} — ${existingIssue.title}](${existingIssue.html_url})`,
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
