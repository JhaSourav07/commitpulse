import { LanguageData, ActivityData } from '@/types/dashboard';

export interface SkillCategory {
  name: string;
  score: number;
  color: string;
  languages: string[];
}

export interface SkillEvolutionData {
  language: string;
  score: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  color: string;
  growthRate: number; // percentage growth in last 3 months
  history: Array<{ month: string; score: number }>;
}

export interface TechGrowthEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'adoption' | 'mastery';
  tech: string;
}

const CATEGORY_MAP: Record<string, { category: string; color: string }> = {
  typescript: { category: 'Frontend/App', color: '#3178c6' },
  javascript: { category: 'Frontend/App', color: '#f1e05a' },
  html: { category: 'Frontend/App', color: '#e34c26' },
  css: { category: 'Frontend/App', color: '#563d7c' },
  vue: { category: 'Frontend/App', color: '#41b883' },
  react: { category: 'Frontend/App', color: '#61dafb' },
  svelte: { category: 'Frontend/App', color: '#ff3e00' },
  
  go: { category: 'Backend/Systems', color: '#00add8' },
  rust: { category: 'Backend/Systems', color: '#deadbeef' },
  python: { category: 'Backend/Systems', color: '#3572a5' },
  java: { category: 'Backend/Systems', color: '#b07219' },
  ruby: { category: 'Backend/Systems', color: '#701516' },
  'c++': { category: 'Backend/Systems', color: '#f34b7d' },
  c: { category: 'Backend/Systems', color: '#555555' },
  'c#': { category: 'Backend/Systems', color: '#178600' },
  php: { category: 'Backend/Systems', color: '#4f5d95' },

  shell: { category: 'DevOps/Cloud', color: '#89e051' },
  dockerfile: { category: 'DevOps/Cloud', color: '#384d54' },
  yaml: { category: 'DevOps/Cloud', color: '#cb171e' },
  makefile: { category: 'DevOps/Cloud', color: '#427819' },

  sql: { category: 'Data/Storage', color: '#e38c00' },
  plsql: { category: 'Data/Storage', color: '#dad8d8' },
  mongodb: { category: 'Data/Storage', color: '#4db33d' },
};

export function calculateSkillCategories(languages: LanguageData[]): SkillCategory[] {
  const categories: Record<string, { scoreSum: number; langs: string[]; color: string }> = {};

  languages.forEach((lang) => {
    const langLower = lang.name.toLowerCase();
    const mapping = CATEGORY_MAP[langLower] || { category: 'General', color: '#6e7681' };
    
    if (!categories[mapping.category]) {
      categories[mapping.category] = {
        scoreSum: 0,
        langs: [],
        color: mapping.color,
      };
    }
    categories[mapping.category].scoreSum += lang.percentage;
    categories[mapping.category].langs.push(lang.name);
  });

  return Object.entries(categories).map(([name, data]) => ({
    name,
    score: Math.round(data.scoreSum),
    color: data.color,
    languages: data.langs,
  })).sort((a, b) => b.score - a.score);
}

export function calculateSkillEvolution(
  languages: LanguageData[],
  activity: ActivityData[]
): SkillEvolutionData[] {
  const totalCommits = activity.reduce((sum, d) => sum + d.count, 0);

  return languages.map((lang) => {
    const percentage = lang.percentage;
    // Calculate basic score using percentage of languages and total commits
    const activeWeight = Math.min(40, totalCommits * 0.05);
    const score = Math.min(100, Math.round(percentage * 0.6 + activeWeight));

    let level: SkillEvolutionData['level'] = 'Beginner';
    if (score >= 80) level = 'Expert';
    else if (score >= 50) level = 'Advanced';
    else if (score >= 25) level = 'Intermediate';

    // Generate historical mock progression for visual chart (last 6 months)
    const history: SkillEvolutionData['history'] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      // Apply linear progress mock back in time
      const progressionFactor = 1 - (i * 0.07);
      history.push({
        month: monthLabel,
        score: Math.max(10, Math.round(score * progressionFactor)),
      });
    }

    const growthRate = score > 15 ? Math.round((history[5].score - history[2].score) / Math.max(1, history[2].score) * 100) : 5;

    return {
      language: lang.name,
      score,
      level,
      color: lang.color,
      growthRate,
      history,
    };
  }).sort((a, b) => b.score - a.score);
}

export function generateTechGrowthEvents(
  languages: LanguageData[],
  activity: ActivityData[]
): TechGrowthEvent[] {
  const events: TechGrowthEvent[] = [];
  const now = new Date();

  // Create technology milestones chronologically based on language lists
  languages.slice(0, 3).forEach((lang, idx) => {
    const monthsAgo = (idx + 1) * 2;
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15).toISOString().split('T')[0];

    events.push({
      id: `adopt-${lang.name}`,
      date,
      title: `${lang.name} Integration`,
      description: `Integrated ${lang.name} as a core technology stack (Reached ${lang.percentage}% of workspace code).`,
      type: 'adoption',
      tech: lang.name,
    });

    if (lang.percentage > 30) {
      const masteryDate = new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString().split('T')[0];
      events.push({
        id: `mastery-${lang.name}`,
        date: masteryDate,
        title: `${lang.name} Mastery`,
        description: `Achieved dominant expertise level in ${lang.name} development.`,
        type: 'mastery',
        tech: lang.name,
      });
    }
  });

  // Always add a milestone for total contributions if high
  const totalCommits = activity.reduce((sum, d) => sum + d.count, 0);
  if (totalCommits > 50) {
    const milestoneDate = new Date(now.getFullYear(), now.getMonth() - 3, 10).toISOString().split('T')[0];
    events.push({
      id: 'commits-milestone',
      date: milestoneDate,
      title: 'Activity MilestoneReached',
      description: `Crossed ${totalCommits} total verified commits across repository footprint.`,
      type: 'milestone',
      tech: 'Git Activity',
    });
  }

  return events.sort((a, b) => b.date.localeCompare(a.date));
}
