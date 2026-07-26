export type TechCategory =
  | 'Languages'
  | 'Frontend'
  | 'UI Libraries'
  | 'Backend'
  | 'Mobile'
  | 'Database'
  | 'ORM & Query'
  | 'Cloud'
  | 'DevOps'
  | 'Tools & IDEs'
  | 'AI & ML'
  | 'Design'
  | 'Other';

export type SocialCategory =
  | 'Social Media'
  | 'Developer'
  | 'Competitive Programming'
  | 'Professional'
  | 'Streaming'
  | 'Contact'
  | 'Portfolio'
  | 'Support';

export type IconType = 'devicon' | 'simpleicon';

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  iconUrl: string;
  type: IconType;
}

export interface Social {
  id: string;
  name: string;
  category: SocialCategory;
  iconUrl: string;
  type: IconType;
  baseUrl: string;
  placeholder: string;
  siSlug?: string;
}

export interface GeneratorState {
  name: string;
  description: string;
  selectedTechs: string[];
  selectedSocials: string[];
  socialLinks: Record<string, string>;
  githubUsername: string;
  showCommitPulse: boolean;
  commitPulseAccent: string;
  showRepoSpotlight: boolean;
  spotlightRepo: string;
  showSnakeGraph: boolean;
  showPacmanGraph: boolean;
  graphPlacement: 'top' | 'middle' | 'bottom';
  showArticles?: boolean;
  articlesPlatform?: 'devto' | 'hashnode';
  articlesUsername?: string;
}
