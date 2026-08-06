// services/leetcode/api.ts

export interface LeetCodeDifficultyStats {
  difficulty: string;
  count: number;
  submissions?: number;
}

export interface LeetCodeStatData {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  acceptanceRate?: number;
  error?: string;
}

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      profile {
        ranking
        reputation
      }
    }
  }
`;

export async function getLeetCodeStats(username: string): Promise<LeetCodeStatData> {
  const trimmedUser = username ? username.trim() : '';

  if (!trimmedUser) {
    return {
      username: '',
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 0,
      error: 'Username is required',
    };
  }

  try {
    const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CommitPulse-LeetCodeCard/1.0',
      },
      body: JSON.stringify({
        query: USER_PROFILE_QUERY,
        variables: { username: trimmedUser },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`LeetCode API request failed with status: ${response.status}`);
      return {
        username: trimmedUser,
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        ranking: 0,
        error: `LeetCode API error (${response.status})`,
      };
    }

    const json = await response.json();

    if (json.errors || !json.data?.matchedUser) {
      return {
        username: trimmedUser,
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        ranking: 0,
        error: 'User not found',
      };
    }

    const matchedUser = json.data.matchedUser;
    const submissionStats: LeetCodeDifficultyStats[] =
      matchedUser.submitStats?.acSubmissionNum || [];
    const profile = matchedUser.profile || {};

    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const stat of submissionStats) {
      const diff = stat.difficulty ? stat.difficulty.toLowerCase() : '';
      if (diff === 'all') {
        totalSolved = stat.count;
      } else if (diff === 'easy') {
        easySolved = stat.count;
      } else if (diff === 'medium') {
        mediumSolved = stat.count;
      } else if (diff === 'hard') {
        hardSolved = stat.count;
      }
    }

    return {
      username: matchedUser.username || trimmedUser,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: profile.ranking || 0,
    };
  } catch (error) {
    console.warn('Error fetching LeetCode stats:', error);
    return {
      username: trimmedUser,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 0,
      error: 'Failed to fetch LeetCode data',
    };
  }
}
