const { parseCommand } = require('./parse-command');
const { hasWriteAccess } = require('./permissions');
const { handleAssign } = require('./assign-handler');
const { handleUnassign } = require('./unassign-handler');
const { handleAddLabel } = require('./addlabel-handler');
const { handleClaim } = require('./claim-handler');
const { handleUnclaim } = require('./unclaim-handler');

module.exports = async ({ github, context, core }) => {
  const commentBody = context.payload.comment?.body;
  const commenter = context.payload.comment?.user?.login;
  const { owner, repo } = context.repo;
  const issueNumber = context.payload.issue?.number;

  if (!context.payload.issue) return;
  if (context.payload.comment?.user?.type === 'Bot') return;

  const parsed = parseCommand(commentBody);
  if (!parsed) return;

  let writerAccess = null;
  const writeRestrictedCommands = ['assign', 'unassign'];

  if (writeRestrictedCommands.includes(parsed.command)) {
    writerAccess = await hasWriteAccess(github, owner, repo, commenter);
  }

  try {
    switch (parsed.command) {
      case 'assign':
        await handleAssign({
          github,
          context,
          username: parsed.username,
          hasWriteAccess: writerAccess,
        });
        break;
      case 'unassign':
        await handleUnassign({
          github,
          context,
          username: parsed.username,
          hasWriteAccess: writerAccess,
        });
        break;
      case 'addlabel':
        await handleAddLabel({ github, context, labelArgs: parsed.labels });
        break;
      case 'claim':
        await handleClaim({ github, context });
        break;
      case 'unclaim':
        await handleUnclaim({ github, context });
        break;
      case 'ping':
        await github.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: `🏓 **Pong!** CommitPulse Bot is online and fully operational.\n> UTC: ${new Date().toUTCString()}`,
        });
        break;
    }
  } catch (error) {
    core.error(`Error processing command /${parsed.command}: ${error.message}`);
    try {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `⚠️ An unexpected error occurred while processing your command. Please try again or contact a maintainer.\n\n> \`${error.message}\``,
      });
    } catch (_) {}
    core.setFailed(error.message);
  }
};
