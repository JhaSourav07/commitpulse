function parseCommand(commentBody) {
  if (!commentBody || typeof commentBody !== 'string') return null;

  const lines = commentBody.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const assignMatch = line.match(/^\/assign\s+@([^\s]+)\s*$/i);
    if (assignMatch) return { command: 'assign', username: assignMatch[1] };

    const unassignMatch = line.match(/^\/unassign\s+@([^\s]+)\s*$/i);
    if (unassignMatch) return { command: 'unassign', username: unassignMatch[1] };

    const claimMatch = line.match(/^\/claim\s*$/i);
    if (claimMatch) return { command: 'claim' };

    const pingMatch = line.match(/^\/ping\s*$/i);
    if (pingMatch) return { command: 'ping' };

    const addlabelMatch = line.match(/^\/addlabel\s+(.+)$/i);
    if (addlabelMatch) {
      const labels = parseLabels(addlabelMatch[1]);
      if (labels.length > 0) return { command: 'addlabel', labels };
      return { command: 'addlabel', labels: [] };
    }

    if (/^\/addlabel\s*$/i.test(line)) {
      return { command: 'addlabel', labels: [] };
    }
  }
  return null;
}

function parseLabels(raw) {
  const labels = [];
  const tokenRegex = /"([^"]+)"|'([^']+)'|(\S+)/g;
  let match;

  while ((match = tokenRegex.exec(raw)) !== null) {
    const label = (match[1] || match[2] || match[3]).trim();
    if (label) labels.push(label);
  }
  return labels;
}

module.exports = { parseCommand, parseLabels };
