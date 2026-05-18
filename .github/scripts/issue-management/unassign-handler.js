async function handleUnassign({ github, context, username, hasWriteAccess }) {
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  const commenter = context.payload.comment.user.login;
  const issueState = context.payload.issue.state;

  if (issueState === 'closed') {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Commands cannot be used on closed issues.`,
    });
    return;
  }

  if (!hasWriteAccess) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `⛔ @${commenter}, you don't have permission to use \`/unassign\`. Only maintainers and collaborators with write access can unassign issues.`,
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

  const currentAssignees = context.payload.issue.assignees.map((a) => a.login.toLowerCase());
  if (!currentAssignees.includes(username.toLowerCase())) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `ℹ️ \`@${username}\` is not assigned to this issue, so there's nothing to unassign.`,
    });
    return;
  }

  await github.rest.issues.removeAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [username],
  });

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `✅ Successfully unassigned @${username} from this issue.\n\n> 🔓 The issue is now open for others to pick up.`,
  });
}

module.exports = { handleUnassign };
