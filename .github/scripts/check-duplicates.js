const github = require('@actions/github');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
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

  // 1. Fetch all open issues in the repository
  console.log('Fetching all open issues...');
  const allIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'open',
    per_page: 100,
  });

  // Filter out Pull Requests
  const openIssues = allIssues.filter((issue) => !issue.pull_request);
  console.log(`Found ${openIssues.length} open issues (excluding Pull Requests).`);

  if (openIssues.length < 2) {
    console.log('ℹ️ Not enough issues to compare. Ending scan.');
    return;
  }

  // 2. Initialize Gemini API
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  // 3. Generate embeddings with 4.1s rate limit delay
  console.log('Generating semantic embeddings using gemini-embedding-001...');
  for (let i = 0; i < openIssues.length; i++) {
    const issue = openIssues[i];
    const textToEmbed = `Title: ${issue.title}\nBody: ${issue.body || ''}`.slice(0, 3000);

    console.log(
      `[${i + 1}/${openIssues.length}] Embedding Issue #${issue.number}: "${issue.title.substring(0, 50)}..."`
    );

    try {
      const result = await model.embedContent(textToEmbed);
      issue.embedding = result.embedding.values;
    } catch (err) {
      console.error(`❌ Failed to generate embedding for Issue #${issue.number}:`, err.message);
      throw err;
    }

    if (i < openIssues.length - 1) {
      console.log('Sleeping for 4.1 seconds to avoid rate limits...');
      await delay(4100);
    }
  }

  // 4. Perform pairwise comparisons
  console.log('\nComparing issues for semantic similarity...');
  let duplicatesCount = 0;

  for (let i = 0; i < openIssues.length; i++) {
    for (let j = i + 1; j < openIssues.length; j++) {
      const issueA = openIssues[i];
      const issueB = openIssues[j];

      const similarity = cosineSimilarity(issueA.embedding, issueB.embedding);

      // Flag if similarity is 85% or higher
      if (similarity >= 0.85) {
        const newerIssue = issueA.number > issueB.number ? issueA : issueB;
        const olderIssue = issueA.number < issueB.number ? issueA : issueB;
        const similarityPercent = (similarity * 100).toFixed(1);

        console.log(
          `⚠️ Possible Duplicate: #${newerIssue.number} and #${olderIssue.number} similarity: ${similarityPercent}%`
        );

        // Check if bot already commented on the newer issue
        console.log(`Checking comments on newer issue #${newerIssue.number}...`);
        const { data: comments } = await octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: newerIssue.number,
        });

        const alreadyFlagged = comments.some(
          (comment) =>
            comment.body &&
            comment.body.includes(
              `My semantic scan detected that this issue might be a duplicate of #${olderIssue.number}`
            )
        );

        if (alreadyFlagged) {
          console.log(
            `ℹ️ Already flagged Issue #${newerIssue.number} as duplicate of #${olderIssue.number}. Skipping comment.`
          );
          continue;
        }

        // Post duplicate warning comment
        const author = newerIssue.user.login;
        const commentBody = `Hey @${author}! 🤖\n\nMy semantic scan detected that this issue might be a duplicate of #${olderIssue.number} (Similarity: **${similarityPercent}%**).\n\nPlease check between these issues and close this one if it is a duplicate.`;

        console.log(`Posting duplicate warning comment on newer issue #${newerIssue.number}...`);
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: newerIssue.number,
          body: commentBody,
        });

        // Add 'possible-duplicate' label to the newer issue
        try {
          console.log(`Adding 'possible-duplicate' label to issue #${newerIssue.number}...`);
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: newerIssue.number,
            labels: ['possible-duplicate'],
          });
        } catch (labelErr) {
          console.warn(
            `⚠️ Warning: Could not add label 'possible-duplicate' to Issue #${newerIssue.number}:`,
            labelErr.message
          );
        }

        duplicatesCount++;
      }
    }
  }

  console.log(`\n🎉 Semantic duplicate scan complete! Flagged ${duplicatesCount} new duplicates.`);
}

run().catch((error) => {
  console.error('❌ Execution failed:', error.message);
  process.exit(1);
});
