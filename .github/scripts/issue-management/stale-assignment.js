async function handleStaleAssignments({ github, context, core }) {
  const { owner, repo } = context.repo;
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const now = new Date();

  console.log(`Starting stale assignment check for ${owner}/${repo}`);

  let page = 1;
  let staleCount = 0;

  while (true) {
    const { data: issues } = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      assignee: '*', // Only fetch issues that have at least one assignee
      per_page: 100,
      page,
    });

    if (issues.length === 0) break;

    for (const issue of issues) {
      // GitHub API returns PRs as issues, we only want actual issues
      if (issue.pull_request) continue;

      const updatedAt = new Date(issue.updated_at);
      const timeSinceUpdate = now.getTime() - updatedAt.getTime();

      if (timeSinceUpdate > TWO_DAYS_MS) {
        console.log(
          `Issue #${issue.number} has been inactive since ${issue.updated_at}. Removing assignees.`
        );

        // 1. Remove all assignees
        const currentAssignees = issue.assignees.map((a) => a.login);
        if (currentAssignees.length > 0) {
          await github.rest.issues.removeAssignees({
            owner,
            repo,
            issue_number: issue.number,
            assignees: currentAssignees,
          });

          // 2. Post a comment
          await github.rest.issues.createComment({
            owner,
            repo,
            issue_number: issue.number,
            body: `⚠️ Assignment automatically removed due to inactivity.\nFeel free to reclaim the issue if you want to continue working on it.`,
          });

          staleCount++;
        }
      }
    }

    if (issues.length < 100) break;
    page++;
  }

  console.log(`Finished checking. Removed assignments from ${staleCount} stale issues.`);
}

module.exports = handleStaleAssignments;
