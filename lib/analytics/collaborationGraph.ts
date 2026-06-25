import type {
  Collaborator,
  CollaborationPair,
  ReviewMetrics,
  TeamConnectivity,
  CollaborationMetrics,
  CollaborationData,
  CollaborationFilter,
} from '@/types/collaboration';

function generateCollaborators(count: number): Collaborator[] {
  const collaborators: Collaborator[] = [];
  const names = [
    'alice',
    'bob',
    'charlie',
    'diana',
    'eve',
    'frank',
    'grace',
    'henry',
    'iris',
    'jack',
  ];

  for (let i = 0; i < Math.min(count, 10); i++) {
    const seed = names[i].charCodeAt(0);
    collaborators.push({
      id: `user-${i + 1}`,
      username: names[i],
      avatarUrl: `https://avatars.githubusercontent.com/u/${1000 + seed}`,
      contributions: Math.floor(Math.random() * 500) + 50,
      reviews: Math.floor(Math.random() * 100) + 10,
      comments: Math.floor(Math.random() * 200) + 20,
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      teamId: i < 5 ? 'team-alpha' : 'team-beta',
    });
  }

  return collaborators;
}

function generateCollaborationPairs(collaborators: Collaborator[]): CollaborationPair[] {
  const pairs: CollaborationPair[] = [];
  const interactionTypes: CollaborationPair['interactionTypes'] = [
    'pr_review',
    'pr_comment',
    'issue_comment',
    'commit',
  ];

  for (let i = 0; i < collaborators.length; i++) {
    for (let j = i + 1; j < collaborators.length; j++) {
      if (Math.random() > 0.4) {
        const strength: CollaborationPair['strength'] =
          Math.random() > 0.7 ? 'strong' : Math.random() > 0.4 ? 'moderate' : 'weak';
        const interactionCount =
          strength === 'strong'
            ? 50 + Math.floor(Math.random() * 100)
            : strength === 'moderate'
              ? 20 + Math.floor(Math.random() * 30)
              : 5 + Math.floor(Math.random() * 15);

        pairs.push({
          collaborator1: collaborators[i].username,
          collaborator2: collaborators[j].username,
          interactionCount,
          interactionTypes: interactionTypes.slice(0, Math.floor(Math.random() * 4) + 1),
          firstInteraction: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          lastInteraction: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          strength,
        });
      }
    }
  }

  return pairs;
}

function generateReviewMetrics(collaborators: Collaborator[]): ReviewMetrics {
  const reviewsByWeek = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const week = new Date(now);
    week.setDate(week.getDate() - i * 7);
    reviewsByWeek.push({
      week: week.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 50) + 10,
    });
  }

  const reviewersByCount = collaborators
    .map((c) => ({
      username: c.username,
      count: c.reviews,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    averageReviewTime: Math.floor(Math.random() * 48) + 4,
    totalReviews: collaborators.reduce((sum, c) => sum + c.reviews, 0),
    reviewsByWeek,
    reviewersByCount,
  };
}

function generateTeamConnectivity(collaborators: Collaborator[]): TeamConnectivity[] {
  const teams = [
    { id: 'team-alpha', name: 'Team Alpha' },
    { id: 'team-beta', name: 'Team Beta' },
  ];

  return teams.map((team) => {
    const members = collaborators.filter((c) => c.teamId === team.id);
    return {
      teamId: team.id,
      teamName: team.name,
      memberCount: members.length,
      internalConnections: Math.floor(Math.random() * 20) + 5,
      externalConnections: Math.floor(Math.random() * 10) + 2,
      connectivityScore: Math.floor(Math.random() * 40) + 60,
      isolatedMembers: members.slice(-1).map((m) => m.username),
    };
  });
}

function calculateBusFactor(collaborators: Collaborator[]): CollaborationMetrics['busFactor'] {
  return [
    {
      repository: 'repo-main',
      score: 35 + Math.floor(Math.random() * 20),
      atRisk: Math.random() > 0.6,
    },
    {
      repository: 'repo-lib',
      score: 55 + Math.floor(Math.random() * 25),
      atRisk: Math.random() > 0.4,
    },
    {
      repository: 'repo-api',
      score: 40 + Math.floor(Math.random() * 30),
      atRisk: Math.random() > 0.5,
    },
  ];
}

function generateMentorshipIndicators(
  collaborators: Collaborator[]
): CollaborationMetrics['mentorshipIndicators'] {
  const indicators = [];
  for (let i = 0; i < Math.min(3, collaborators.length - 1); i++) {
    indicators.push({
      mentor: collaborators[i].username,
      mentee: collaborators[i + 1].username,
      score: Math.floor(Math.random() * 40) + 60,
    });
  }
  return indicators;
}

function generateNetworkData(collaborators: Collaborator[], pairs: CollaborationPair[]) {
  const nodes = collaborators.map((c) => ({
    id: c.username,
    group: c.teamId || 'default',
  }));

  const links = pairs.map((p) => ({
    source: p.collaborator1,
    target: p.collaborator2,
    value: p.interactionCount / 10,
  }));

  return { nodes, links };
}

export function analyzeCollaboration(filter?: CollaborationFilter): CollaborationData {
  const collaborators = generateCollaborators(8);
  const collaborationPairs = generateCollaborationPairs(collaborators);
  const reviewMetrics = generateReviewMetrics(collaborators);
  const teamConnectivity = generateTeamConnectivity(collaborators);

  const totalInteractions = collaborationPairs.reduce((sum, p) => sum + p.interactionCount, 0);
  const activeCollaborators = collaborators.filter(
    (c) => new Date(c.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  const overallMetrics: CollaborationMetrics = {
    totalCollaborators: collaborators.length,
    activeCollaborators,
    averageInteractions:
      collaborators.length > 0 ? Math.floor(totalInteractions / collaborators.length) : 0,
    collaborationDiversityScore: Math.floor(Math.random() * 30) + 70,
    busFactor: calculateBusFactor(collaborators),
    mentorshipIndicators: generateMentorshipIndicators(collaborators),
  };

  const trends = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      collaborationScore: Math.floor(Math.random() * 20) + 70,
    });
  }

  return {
    collaborators,
    collaborationPairs,
    reviewMetrics,
    teamConnectivity,
    overallMetrics,
    networkData: generateNetworkData(collaborators, collaborationPairs),
    trends,
  };
}

export { generateCollaborators, generateCollaborationPairs };
