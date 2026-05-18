async function hasWriteAccess(github, owner, repo, username) {
  try {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username,
    });
    return data.permission === 'admin' || data.permission === 'write';
  } catch (error) {
    if (error.status === 404 || error.status === 403) return false;
    throw error;
  }
}

module.exports = { hasWriteAccess };
