async function handleUnclaim({ github, context }) {
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

  const currentAssignees = context.payload.issue.assignees.map((a) => a.login.toLowerCase());

  if (!currentAssignees.includes(commenter.toLowerCase())) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `ℹ️ @${commenter}, you are not currently assigned to this issue, so there's nothing to unclaim.`,
    });
    return;
  }

  await github.rest.issues.removeAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [commenter],
  });

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `✅ Successfully unclaimed this issue for @${commenter}.\n\n> 🔓 The issue is now open for others to claim.`,
  });
}

module.exports = { handleUnclaim };
