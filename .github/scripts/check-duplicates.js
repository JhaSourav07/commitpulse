const github = require('@actions/github');
const { GoogleGenerativeAI } = require('@google/generative-ai');

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function run() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const githubToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;

  if (!geminiApiKey) {
    throw new Error('❌ Missing GEMINI_API_KEY environment variable.');
  }

  if (!githubToken) {
    throw new Error('❌ Missing GITHUB_PAT or GITHUB_TOKEN environment variable.');
  }

  const octokit = github.getOctokit(githubToken);
  const { owner, repo } = github.context.repo;

  console.log(`🤖 Starting semantic scan for duplicates in ${owner}/${repo}...`);

  const currentIssueNumber = github.context.payload.issue?.number;

  // Prevent failures when executed from pull_request,
  // workflow_dispatch, schedule, etc.
  if (!currentIssueNumber) {
    console.log('ℹ️ No issue payload detected. Skipping duplicate scan.');
    return;
  }

  console.log('Fetching all open issues...');

  const allIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'open',
    per_page: 100,
  });

  const openIssues = allIssues.filter((issue) => !issue.pull_request);

  console.log(`Found ${openIssues.length} open issues (excluding Pull Requests).`);

  if (openIssues.length < 2) {
    console.log('ℹ️ Not enough issues to compare. Ending scan.');
    return;
  }

  const currentIssue = openIssues.find((issue) => issue.number === currentIssueNumber);

  if (!currentIssue) {
    console.log(`ℹ️ Triggering issue #${currentIssueNumber} is not open. Skipping scan.`);
    return;
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-embedding-001',
  });

  console.log(`Generating embedding for Issue #${currentIssue.number}...`);

  const currentText = `Title: ${currentIssue.title}\nBody: ${currentIssue.body || ''}`.slice(
    0,
    3000
  );

  const currentResult = await model.embedContent(currentText);

  const currentEmbedding = currentResult.embedding.values;

  const { data: existingComments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: currentIssue.number,
  });

  const candidateIssues = openIssues.filter((issue) => issue.number !== currentIssue.number);

  console.log(`Comparing against ${candidateIssues.length} existing issues...`);

  let duplicatesCount = 0;

  for (const candidateIssue of candidateIssues) {
    const candidateText =
      `Title: ${candidateIssue.title}\nBody: ${candidateIssue.body || ''}`.slice(0, 3000);

    let candidateEmbedding;

    try {
      const candidateResult = await model.embedContent(candidateText);

      candidateEmbedding = candidateResult.embedding.values;
    } catch (error) {
      console.warn(
        `⚠️ Failed to generate embedding for Issue #${candidateIssue.number}:`,
        error.message
      );
      continue;
    }

    const similarity = cosineSimilarity(currentEmbedding, candidateEmbedding);

    if (similarity < 0.85) {
      continue;
    }

    const similarityPercent = (similarity * 100).toFixed(1);

    console.log(
      `⚠️ Possible duplicate: #${currentIssue.number} ↔ #${candidateIssue.number} (${similarityPercent}%)`
    );

    const duplicateMessage = `My semantic scan detected that this issue might be a duplicate of #${candidateIssue.number}`;

    const alreadyFlagged = existingComments.some(
      (comment) => comment.body && comment.body.includes(duplicateMessage)
    );

    if (alreadyFlagged) {
      continue;
    }

    const author = currentIssue.user.login;

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: currentIssue.number,
      body:
        `Hey @${author}! 🤖\n\n` +
        `${duplicateMessage} (Similarity: **${similarityPercent}%**).\n\n` +
        'Please review both issues and close this one if it is a duplicate.',
    });

    try {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: currentIssue.number,
        labels: ['possible-duplicate'],
      });
    } catch (error) {
      console.warn(`⚠️ Failed to add label to Issue #${currentIssue.number}:`, error.message);
    }

    duplicatesCount++;
  }

  console.log(
    `🎉 Semantic duplicate scan complete! Flagged ${duplicatesCount} potential duplicates.`
  );
}

run().catch((error) => {
  console.error('❌ Execution failed:', error.message);
  process.exit(1);
});
