async function handleStaleAssignments({ github, context, core }) {
  const { owner, repo } = context.repo;
  const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 absolute hours
  const now = new Date();

  console.log(`Starting stale assignment check for ${owner}/${repo}`);

  // Pre-fetch all open pull requests to build a Set of referenced issues.
  // This avoids calling the search API in a loop for each candidate stale issue,
  // which quickly exhausts search rate limits.
  const referencedIssues = new Set();
  let prPage = 1;

  while (true) {
    console.log(`Fetching page ${prPage} of open pull requests...`);
    const { data: prs } = await github.rest.pulls.list({
      owner,
      repo,
      state: 'open',
      per_page: 100,
      page: prPage,
    });

    if (prs.length === 0) break;

    for (const pr of prs) {
      // Find issue references like #123 in the PR title or body
      const textToSearch = `${pr.title || ''} ${pr.body || ''}`;
      const issueMatches = textToSearch.match(/#(\d+)\b/g);
      if (issueMatches) {
        for (const match of issueMatches) {
          const num = parseInt(match.slice(1), 10);
          if (!isNaN(num)) {
            referencedIssues.add(num);
          }
        }
      }

      // Also look for branch names containing issue numbers, e.g. "issue-123", "fix-123"
      if (pr.head && pr.head.ref) {
        const branchMatches = pr.head.ref.match(/(?:issue|bug|feat|fix)-(\d+)\b/i);
        if (branchMatches) {
          const num = parseInt(branchMatches[1], 10);
          if (!isNaN(num)) {
            referencedIssues.add(num);
          }
        }
      }
    }

    if (prs.length < 100) break;
    prPage++;
  }

  console.log(`Found ${referencedIssues.size} unique issues referenced in open pull requests.`);

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

      if (timeSinceUpdate > STALE_THRESHOLD_MS) {
        const currentAssignees = issue.assignees.map((a) => a.login);
        if (currentAssignees.length === 0) continue;

        // Check if any open PRs reference this issue before unassigning
        if (referencedIssues.has(issue.number)) {
          console.log(
            `Issue #${issue.number} has open PR(s) referencing it. Skipping stale unassignment.`
          );
          continue;
        }

        console.log(
          `Issue #${issue.number} has been inactive since ${issue.updated_at}. Removing assignees.`
        );

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

    if (issues.length < 100) break;
    page++;
  }

  console.log(`Finished checking. Removed assignments from ${staleCount} stale issues.`);
}

module.exports = handleStaleAssignments;
