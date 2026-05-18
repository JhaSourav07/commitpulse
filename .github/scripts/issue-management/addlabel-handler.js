async function fetchRepoLabels(github, owner, repo) {
  const labelMap = new Map();
  let page = 1;

  while (true) {
    const { data: labels } = await github.rest.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
      page,
    });

    if (labels.length === 0) break;

    for (const label of labels) {
      labelMap.set(label.name.toLowerCase(), label.name);
    }

    if (labels.length < 100) break;
    page++;
  }

  return labelMap;
}

async function handleAddLabel({ github, context, labelArgs }) {
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue.number;
  const issueState = context.payload.issue.state;
  const commenter = context.payload.comment.user.login;

  if (issueState === 'closed') {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ Cannot add labels — this issue is already **closed**.`,
    });
    return;
  }

  if (!labelArgs || labelArgs.length === 0) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ @${commenter}, please provide at least one label name.\n\n**Usage:** \`/addlabel label1 label2 ...\`\n\n**Example:** \`/addlabel good-first-issue frontend\``,
    });
    return;
  }

  const seen = new Set();
  const uniqueLabelArgs = [];
  for (const label of labelArgs) {
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLabelArgs.push(label);
    }
  }

  const repoLabels = await fetchRepoLabels(github, owner, repo);
  const validLabels = [];
  const invalidLabels = [];

  for (const labelArg of uniqueLabelArgs) {
    const canonical = repoLabels.get(labelArg.toLowerCase());
    if (canonical) {
      validLabels.push(canonical);
    } else {
      invalidLabels.push(labelArg);
    }
  }

  if (invalidLabels.length > 0) {
    const invalidList = invalidLabels.map((l) => `\`${l}\``).join(', ');
    const availableLabels = [...repoLabels.values()]
      .slice(0, 20)
      .map((l) => `\`${l}\``)
      .join(', ');

    const moreLabelsNote =
      repoLabels.size > 20
        ? `\n> _...and ${repoLabels.size - 20} more. Check the [Labels page](../labels) for the full list._`
        : '';

    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `❌ The following label(s) do not exist in this repository: ${invalidList}\n\n**Available labels:**\n${availableLabels}${moreLabelsNote}\n\n> 💡 Labels are case-insensitive. If you need a new label created, please ask a maintainer.`,
    });
    return;
  }

  const existingLabels = context.payload.issue.labels.map((l) => l.name.toLowerCase());
  const newLabels = validLabels.filter((l) => !existingLabels.includes(l.toLowerCase()));
  const alreadyApplied = validLabels.filter((l) => existingLabels.includes(l.toLowerCase()));

  if (newLabels.length === 0) {
    const alreadyList = alreadyApplied.map((l) => `\`${l}\``).join(', ');
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `ℹ️ All specified labels are already applied to this issue: ${alreadyList}`,
    });
    return;
  }

  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: newLabels,
  });

  const addedList = newLabels.map((l) => `\`${l}\``).join(', ');
  let body = `✅ Added labels: ${addedList}`;

  if (alreadyApplied.length > 0) {
    const skippedList = alreadyApplied.map((l) => `\`${l}\``).join(', ');
    body += `\n\n> ℹ️ Already applied (skipped): ${skippedList}`;
  }

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}

module.exports = { handleAddLabel };
