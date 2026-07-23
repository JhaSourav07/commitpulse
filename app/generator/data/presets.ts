import type { GeneratorState } from '../types';

export interface ProfilePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge: string;
  state: Partial<GeneratorState>;
}

export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    id: 'fullstack',
    name: 'Full-Stack Developer',
    description: 'Modern web apps, APIs, and databases',
    icon: '⚡',
    badge: 'Popular',
    state: {
      name: "Hi 👋, I'm a Full-Stack Developer",
      description:
        'Building scalable web applications, modern APIs, and high-performance user experiences.',
      selectedTechs: [
        'javascript',
        'typescript',
        'react',
        'nextjs',
        'nodejs',
        'tailwindcss',
        'mongodb',
        'postgresql',
        'docker',
        'git',
      ],
      selectedSocials: ['github', 'linkedin', 'twitter'],
      showCommitPulse: true,
      showSnakeGraph: true,
      graphPlacement: 'bottom',
    },
  },
  {
    id: 'opensource',
    name: 'Open Source Maintainer',
    description: 'Community tools, CLI packages, and backend architecture',
    icon: '🚀',
    badge: 'Open Source',
    state: {
      name: '🚀 Open Source Maintainer & Architect',
      description:
        'Passionate about building open-source developer tools, CLI utilities, and distributed backend systems.',
      selectedTechs: [
        'typescript',
        'go',
        'rust',
        'python',
        'docker',
        'kubernetes',
        'graphql',
        'git',
        'linux',
      ],
      selectedSocials: ['github', 'twitter', 'devto', 'discord'],
      showCommitPulse: true,
      showRepoSpotlight: true,
      showSnakeGraph: true,
      graphPlacement: 'bottom',
    },
  },
  {
    id: 'datascientist',
    name: 'Data Scientist & AI Engineer',
    description: 'Machine learning, data pipelines, and AI models',
    icon: '🤖',
    badge: 'AI / ML',
    state: {
      name: '🤖 Data Scientist & AI/ML Engineer',
      description:
        'Transforming complex data into insights, training deep learning models, and building intelligent AI applications.',
      selectedTechs: [
        'python',
        'pytorch',
        'tensorflow',
        'pandas',
        'numpy',
        'jupyter',
        'docker',
        'aws',
      ],
      selectedSocials: ['github', 'linkedin', 'kaggle', 'medium'],
      showCommitPulse: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    },
  },
  {
    id: 'frontend',
    name: 'Frontend Specialist & UI Engineer',
    description: 'Design systems, fluid animations, and pixel-perfect UIs',
    icon: '✨',
    badge: 'Design UI',
    state: {
      name: '✨ Frontend Architect & UI Engineer',
      description:
        'Crafting pixel-perfect web interfaces, responsive design systems, and rich micro-interactions.',
      selectedTechs: [
        'javascript',
        'typescript',
        'react',
        'vue',
        'nextjs',
        'tailwindcss',
        'figma',
        'framer',
        'sass',
      ],
      selectedSocials: ['github', 'linkedin', 'twitter', 'codepen', 'dribbble'],
      showCommitPulse: true,
      showSnakeGraph: true,
      graphPlacement: 'bottom',
    },
  },
];
