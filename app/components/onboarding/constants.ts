export const DEMO_USERNAMES = ['torvalds', 'gaearon', 'vercel'] as const;

/** Shown in the empty-state preview so first-time visitors see the end product. */
export const SAMPLE_PREVIEW_USERNAME = 'torvalds';

export const DEMO_STATS = [
  { label: 'Current Streak', value: 12, suffix: ' days' },
  { label: 'Longest Streak', value: 47, suffix: ' days' },
  { label: 'Total Contributions', value: 1247, suffix: '' },
  { label: 'Repositories', value: 83, suffix: '' },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    title: 'Enter Username',
    description: 'Type any public GitHub username or pick a demo profile below.',
  },
  {
    step: '2',
    title: 'Generate Badge',
    description: 'Preview your live 3D streak monolith instantly in the browser.',
  },
  {
    step: '3',
    title: 'Add to README',
    description: 'Copy the markdown snippet and paste it into your profile README.',
  },
] as const;
