import { TECHNOLOGIES, TECH_CATEGORIES } from '../../app/generator/data/technologies';
import type { TechCategory, Technology } from '../../app/generator/types';
import type { GraphEdge, GraphNode, RecommendationCategory, RecommendationStrength } from './types';

type EdgeBucket = {
  targetId: string;
  score: number;
  category: RecommendationCategory;
  reasons: Set<string>;
};

type CuratedRule = {
  sources: string[];
  targets: string[];
  score: number;
  reason: string;
};

const TECHNOLOGY_BY_ID = new Map<string, Technology>(
  TECHNOLOGIES.map((tech) => [tech.id, tech] as const)
);

const TECHNOLOGIES_BY_CATEGORY = new Map<TechCategory, Technology[]>();

for (const tech of TECHNOLOGIES) {
  const list = TECHNOLOGIES_BY_CATEGORY.get(tech.category) ?? [];
  list.push(tech);
  TECHNOLOGIES_BY_CATEGORY.set(tech.category, list);
}

const KNOWN_IDS = new Set(TECHNOLOGIES.map((tech) => tech.id));

const TARGET_PRIORITY: Record<string, number> = {
  javascript: 100,
  typescript: 99,
  react: 98,
  nextjs: 97,
  tailwindcss: 97,
  shadcnui: 96,
  nodejs: 95,
  express: 94,
  nestjs: 94,
  fastapi: 94,
  django: 94,
  flask: 92,
  spring: 93,
  postgresql: 95,
  mysql: 90,
  mongodb: 91,
  prisma: 95,
  drizzle: 92,
  docker: 96,
  kubernetes: 94,
  aws: 95,
  vercel: 95,
  git: 92,
  github: 92,
  githubactions: 93,
  vscode: 95,
  vite: 96,
  python: 98,
  java: 94,
  csharp: 91,
  go: 92,
  rust: 91,
  flutter: 93,
  reactnative: 91,
  firebase: 91,
  supabase: 92,
  openai: 93,
  langchain: 92,
  pytorch: 92,
  tensorflow: 92,
  numpy: 92,
  pandas: 92,
  jupyter: 91,
  figma: 92,
  linear: 40,
  jira: 88,
  notion: 88,
};

function isKnown(id: string): boolean {
  return KNOWN_IDS.has(id);
}

function getTech(id: string): Technology | undefined {
  return TECHNOLOGY_BY_ID.get(id);
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getPriority(id: string): number {
  return TARGET_PRIORITY[id] ?? 0;
}

function strengthFromScore(score: number): RecommendationStrength {
  if (score >= 0.8) return 'strong';
  if (score >= 0.5) return 'moderate';
  return 'weak';
}

function toRecommendationCategory(category: TechCategory): RecommendationCategory {
  switch (category) {
    case 'Frontend':
    case 'Mobile':
      return 'Frontend';
    case 'UI Libraries':
    case 'Design':
      return 'Styling';
    case 'Database':
    case 'ORM & Query':
      return 'Database';
    case 'Backend':
      return 'Backend';
    case 'Cloud':
    case 'DevOps':
    case 'Tools & IDEs':
    case 'AI & ML':
    case 'Languages':
    case 'Other':
    default:
      return 'Tooling';
  }
}

function stableSortCandidates(sourceId: string, candidates: Technology[]): Technology[] {
  return [...candidates].sort((a, b) => {
    const pa = getPriority(a.id);
    const pb = getPriority(b.id);

    if (pb !== pa) return pb - pa;

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    const ha = hashString(`${sourceId}:${a.id}`);
    const hb = hashString(`${sourceId}:${b.id}`);
    return ha - hb;
  });
}

function addCandidate(
  bucketMap: Map<string, Map<string, EdgeBucket>>,
  sourceId: string,
  targetId: string,
  score: number,
  category: RecommendationCategory,
  reason: string
): void {
  if (!isKnown(sourceId) || !isKnown(targetId) || sourceId === targetId) return;

  const sourceBucket = bucketMap.get(sourceId) ?? new Map<string, EdgeBucket>();
  const current = sourceBucket.get(targetId);

  if (current) {
    current.score = Math.max(current.score, score);
    current.category = score >= current.score ? category : current.category;
    current.reasons.add(reason);
  } else {
    sourceBucket.set(targetId, {
      targetId,
      score,
      category,
      reasons: new Set([reason]),
    });
  }

  bucketMap.set(sourceId, sourceBucket);
}

function connectManyToMany(
  bucketMap: Map<string, Map<string, EdgeBucket>>,
  sources: string[],
  targets: string[],
  score: number,
  reason: string
): void {
  for (const sourceId of sources) {
    if (!isKnown(sourceId)) continue;

    for (const targetId of targets) {
      if (!isKnown(targetId)) continue;

      const target = getTech(targetId);
      if (!target) continue;

      addCandidate(
        bucketMap,
        sourceId,
        targetId,
        score,
        toRecommendationCategory(target.category),
        reason
      );
    }
  }
}

function connectCategoryToCategories(
  bucketMap: Map<string, Map<string, EdgeBucket>>,
  sourceCategory: TechCategory,
  targetCategories: TechCategory[],
  score: number,
  reason: string,
  limitPerTargetCategory = 8
): void {
  const sources = TECHNOLOGIES_BY_CATEGORY.get(sourceCategory) ?? [];

  for (const source of sources) {
    for (const targetCategory of targetCategories) {
      const targets = (TECHNOLOGIES_BY_CATEGORY.get(targetCategory) ?? []).filter(
        (tech) => tech.id !== source.id
      );

      const selectedTargets = stableSortCandidates(source.id, targets).slice(
        0,
        Math.min(limitPerTargetCategory, targets.length)
      );

      for (const target of selectedTargets) {
        addCandidate(
          bucketMap,
          source.id,
          target.id,
          score,
          toRecommendationCategory(target.category),
          reason
        );
      }
    }
  }
}

function connectSameCategoryAlternatives(
  bucketMap: Map<string, Map<string, EdgeBucket>>,
  category: TechCategory,
  score: number,
  reason: string,
  limit = 7
): void {
  const techs = TECHNOLOGIES_BY_CATEGORY.get(category) ?? [];

  for (const source of techs) {
    const peers = techs
      .filter((tech) => tech.id !== source.id)
      .sort((a, b) => {
        const pa = getPriority(a.id);
        const pb = getPriority(b.id);
        if (pb !== pa) return pb - pa;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    for (const target of peers) {
      addCandidate(
        bucketMap,
        source.id,
        target.id,
        score,
        toRecommendationCategory(target.category),
        reason
      );
    }
  }
}

function connectFamilyRing(
  bucketMap: Map<string, Map<string, EdgeBucket>>,
  family: string[],
  score: number,
  reason: string
): void {
  const ids = family.filter(isKnown);
  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (i === j) continue;

      const source = ids[i];
      const target = ids[j];
      const tech = getTech(target);
      if (!tech) continue;

      addCandidate(
        bucketMap,
        source,
        target,
        score,
        toRecommendationCategory(tech.category),
        reason
      );
    }
  }
}

function buildCuratedRules(): CuratedRule[] {
  return [
    {
      sources: ['javascript', 'typescript'],
      targets: [
        'react',
        'nextjs',
        'nodejs',
        'vite',
        'tailwindcss',
        'shadcnui',
        'prisma',
        'postgresql',
        'docker',
        'vercel',
      ],
      score: 0.95,
      reason: 'Core modern JavaScript/TypeScript stack',
    },
    {
      sources: ['react'],
      targets: [
        'nextjs',
        'typescript',
        'vite',
        'tailwindcss',
        'shadcnui',
        'framermotion',
        'storybook',
        'vercel',
        'nodejs',
      ],
      score: 0.94,
      reason: 'Common React ecosystem pairings',
    },
    {
      sources: ['nextjs'],
      targets: [
        'react',
        'tailwindcss',
        'vercel',
        'prisma',
        'postgresql',
        'docker',
        'githubactions',
        'nodejs',
      ],
      score: 0.93,
      reason: 'Full-stack Next.js deployment and data stack',
    },
    {
      sources: ['vuejs'],
      targets: ['nuxtjs', 'vite', 'tailwindcss', 'pinia', 'vercel', 'nodejs'],
      score: 0.92,
      reason: 'Vue ecosystem stack',
    },
    {
      sources: ['angularjs'],
      targets: ['typescript', 'rxjs', 'materialui', 'nodejs', 'tailwindcss'],
      score: 0.91,
      reason: 'Angular ecosystem stack',
    },
    {
      sources: ['svelte'],
      targets: ['vite', 'tailwindcss', 'vercel', 'nodejs', 'shadcnui'],
      score: 0.9,
      reason: 'Svelte app stack',
    },
    {
      sources: ['astro', 'remix', 'preact', 'qwik', 'solidjs', 'htmx', 'alpinejs'],
      targets: ['tailwindcss', 'shadcnui', 'vite', 'vercel', 'nodejs'],
      score: 0.88,
      reason: 'Modern frontend delivery stack',
    },
    {
      sources: ['nodejs'],
      targets: [
        'express',
        'nextjs',
        'nestjs',
        'fastify',
        'mongodb',
        'postgresql',
        'prisma',
        'docker',
        'githubactions',
      ],
      score: 0.94,
      reason: 'Node.js backend ecosystem',
    },
    {
      sources: ['express'],
      targets: ['mongodb', 'postgresql', 'redis', 'docker', 'prisma', 'nodejs'],
      score: 0.92,
      reason: 'Express backend stack',
    },
    {
      sources: ['nestjs'],
      targets: ['postgresql', 'prisma', 'docker', 'kubernetes', 'aws', 'nodejs'],
      score: 0.92,
      reason: 'NestJS enterprise backend stack',
    },
    {
      sources: ['fastapi', 'django', 'flask'],
      targets: ['postgresql', 'redis', 'docker', 'nginx', 'aws', 'python'],
      score: 0.92,
      reason: 'Python backend stack',
    },
    {
      sources: ['spring'],
      targets: ['postgresql', 'docker', 'kubernetes', 'aws', 'java'],
      score: 0.92,
      reason: 'Spring Boot backend stack',
    },
    {
      sources: ['laravel', 'rails', 'php', 'ruby'],
      targets: ['postgresql', 'mysql', 'redis', 'docker', 'aws'],
      score: 0.9,
      reason: 'Traditional web backend stack',
    },
    {
      sources: ['go', 'gin', 'fiber', 'hono', 'actix', 'phoenix'],
      targets: ['postgresql', 'redis', 'docker', 'kubernetes', 'aws'],
      score: 0.9,
      reason: 'High-performance backend stack',
    },
    {
      sources: ['csharp', 'dotnet', 'fsharp', 'xamarin'],
      targets: ['postgresql', 'docker', 'azure', 'kubernetes', 'sqlserver'],
      score: 0.9,
      reason: '.NET ecosystem stack',
    },
    {
      sources: [
        'flutter',
        'reactnative',
        'android',
        'apple',
        'expo',
        'ionic',
        'capacitor',
        'xamarin',
      ],
      targets: ['firebase', 'androidstudio', 'xcode', 'nodejs', 'postgresql'],
      score: 0.89,
      reason: 'Mobile application stack',
    },
    {
      sources: [
        'postgresql',
        'mysql',
        'sqlite',
        'mariadb',
        'mongodb',
        'redis',
        'firebase',
        'supabase',
      ],
      targets: ['prisma', 'drizzle', 'typeorm', 'sequelize', 'mongoose', 'sqlalchemy', 'hibernate'],
      score: 0.92,
      reason: 'Data access and persistence layer',
    },
    {
      sources: ['prisma', 'drizzle', 'typeorm', 'sequelize', 'mongoose', 'sqlalchemy', 'hibernate'],
      targets: ['postgresql', 'mysql', 'mongodb', 'sqlite', 'redis'],
      score: 0.94,
      reason: 'ORM and database pairing',
    },
    {
      sources: [
        'aws',
        'googlecloud',
        'azure',
        'vercel',
        'netlify',
        'digitalocean',
        'heroku',
        'railway',
        'render',
        'fly',
        'cloudflare',
      ],
      targets: ['docker', 'kubernetes', 'terraform', 'githubactions', 'nginx'],
      score: 0.9,
      reason: 'Cloud deployment stack',
    },
    {
      sources: [
        'docker',
        'kubernetes',
        'terraform',
        'ansible',
        'jenkins',
        'githubactions',
        'circleci',
        'gitlab',
        'helm',
        'argocd',
      ],
      targets: [
        'aws',
        'azure',
        'googlecloud',
        'nginx',
        'prometheus',
        'grafana',
        'sentry',
        'datadog',
      ],
      score: 0.9,
      reason: 'DevOps and infrastructure stack',
    },
    {
      sources: [
        'git',
        'github',
        'bitbucket',
        'vscode',
        'vim',
        'neovim',
        'intellij',
        'androidstudio',
        'xcode',
        'linux',
        'ubuntu',
        'archlinux',
        'debian',
        'windows11',
        'apple-os',
      ],
      targets: [
        'docker',
        'githubactions',
        'eslint',
        'prettier',
        'npm',
        'yarn',
        'pnpm',
        'vite',
        'webpack',
        'rollup',
        'turborepo',
        'bun',
        'deno',
      ],
      score: 0.82,
      reason: 'Developer productivity stack',
    },
    {
      sources: ['python'],
      targets: [
        'numpy',
        'pandas',
        'jupyter',
        'scikitlearn',
        'pytorch',
        'tensorflow',
        'keras',
        'opencv',
        'matplotlib',
        'langchain',
        'openai',
      ],
      score: 0.94,
      reason: 'Python data and AI ecosystem',
    },
    {
      sources: [
        'numpy',
        'pandas',
        'jupyter',
        'scikitlearn',
        'pytorch',
        'tensorflow',
        'keras',
        'opencv',
        'matplotlib',
        'langchain',
        'openai',
      ],
      targets: ['python', 'fastapi', 'django', 'flask', 'spark', 'databricks', 'postgresql'],
      score: 0.91,
      reason: 'Applied machine learning workflow',
    },
    {
      sources: ['spark', 'databricks'],
      targets: ['python', 'pandas', 'jupyter', 'postgresql', 'aws', 'docker'],
      score: 0.9,
      reason: 'Data engineering stack',
    },
    {
      sources: [
        'figma',
        'sketch',
        'photoshop',
        'illustrator',
        'aftereffects',
        'premiere',
        'blender',
        'canva',
      ],
      targets: ['tailwindcss', 'storybook', 'react', 'framer', 'shadcnui'],
      score: 0.84,
      reason: 'Design to implementation workflow',
    },
    {
      sources: ['solidity', 'ethereum', 'hardhat', 'ipfs'],
      targets: ['javascript', 'typescript', 'nodejs', 'react', 'nextjs', 'webassembly'],
      score: 0.85,
      reason: 'Web3 application stack',
    },
    {
      sources: ['unity', 'unrealengine', 'godot'],
      targets: ['csharp', 'c', 'cplusplus', 'blender', 'github', 'docker'],
      score: 0.82,
      reason: 'Game development stack',
    },
    {
      sources: ['stripe', 'twilio'],
      targets: ['nodejs', 'typescript', 'react', 'nextjs', 'docker', 'aws'],
      score: 0.86,
      reason: 'Product integration stack',
    },
  ];
}

const CATEGORY_RELATIONS: Record<TechCategory, TechCategory[]> = {
  Languages: ['Frontend', 'Backend', 'Tools & IDEs', 'Database'],
  Frontend: ['UI Libraries', 'Backend', 'Cloud', 'Tools & IDEs', 'Design'],
  'UI Libraries': ['Frontend', 'Design', 'Tools & IDEs'],
  Backend: ['Database', 'ORM & Query', 'Cloud', 'DevOps', 'Tools & IDEs'],
  Mobile: ['Backend', 'Database', 'Cloud', 'Tools & IDEs'],
  Database: ['ORM & Query', 'Cloud', 'DevOps', 'Backend'],
  'ORM & Query': ['Database', 'Backend', 'Cloud'],
  Cloud: ['DevOps', 'Backend', 'Tools & IDEs'],
  DevOps: ['Cloud', 'Backend', 'Tools & IDEs'],
  'Tools & IDEs': ['Frontend', 'Backend', 'DevOps', 'Database', 'AI & ML'],
  'AI & ML': ['Tools & IDEs', 'Database', 'Backend', 'Cloud'],
  Design: ['Frontend', 'UI Libraries', 'Tools & IDEs'],
  Other: ['Frontend', 'Backend', 'Cloud', 'Tools & IDEs'],
};

const SAME_CATEGORY_SCORE: Partial<Record<TechCategory, number>> = {
  Frontend: 0.84,
  'UI Libraries': 0.8,
  Backend: 0.78,
  Mobile: 0.76,
  Database: 0.74,
  'ORM & Query': 0.76,
  Cloud: 0.7,
  DevOps: 0.74,
  'Tools & IDEs': 0.68,
  'AI & ML': 0.74,
  Design: 0.7,
  Other: 0.58,
};

const LANG_FAMILIES: Record<string, string[]> = {
  javascriptFamily: [
    'javascript',
    'typescript',
    'html5',
    'css3',
    'sass',
    'graphql',
    'bash',
    'powershell',
  ],
  systemsFamily: ['c', 'cplusplus', 'rust', 'zig', 'webassembly'],
  jvmFamily: ['java', 'kotlin', 'scala', 'clojure', 'fsharp'],
  dynamicFamily: ['python', 'ruby', 'php', 'perl', 'lua', 'r', 'julia', 'haskell', 'ocaml'],
  backendFamily: ['elixir', 'erlang', 'go', 'dart', 'swift', 'solidity'],
  mobileFamily: ['dart', 'swift', 'kotlin', 'java'],
  web3Family: ['solidity', 'webassembly', 'javascript', 'typescript'],
};

function applyCuratedRules(
  bucketMap: Map<string, Map<string, EdgeBucket>>,
  rules: CuratedRule[]
): void {
  for (const rule of rules) {
    const validSources = rule.sources.filter(isKnown);
    const validTargets = rule.targets.filter(isKnown);

    for (const sourceId of validSources) {
      for (const targetId of validTargets) {
        const target = getTech(targetId);
        if (!target) continue;

        addCandidate(
          bucketMap,
          sourceId,
          targetId,
          rule.score,
          toRecommendationCategory(target.category),
          rule.reason
        );
      }
    }
  }
}

function applyLanguageFamilies(bucketMap: Map<string, Map<string, EdgeBucket>>): void {
  for (const family of Object.values(LANG_FAMILIES)) {
    connectFamilyRing(bucketMap, family, 0.42, 'Related language or ecosystem alternative');
  }
}

function applySameCategoryRules(bucketMap: Map<string, Map<string, EdgeBucket>>): void {
  for (const category of TECH_CATEGORIES) {
    if (category === 'Languages') continue;

    const score = SAME_CATEGORY_SCORE[category] ?? 0.6;
    connectSameCategoryAlternatives(
      bucketMap,
      category,
      score,
      'Popular alternative in the same ecosystem',
      7
    );
  }
}

function applyCategoryRelations(bucketMap: Map<string, Map<string, EdgeBucket>>): void {
  for (const sourceCategory of TECH_CATEGORIES) {
    const targetCategories = CATEGORY_RELATIONS[sourceCategory] ?? [];
    let score = 0.62;

    switch (sourceCategory) {
      case 'Frontend':
        score = 0.76;
        break;
      case 'UI Libraries':
        score = 0.8;
        break;
      case 'Backend':
        score = 0.78;
        break;
      case 'Mobile':
        score = 0.74;
        break;
      case 'Database':
        score = 0.76;
        break;
      case 'ORM & Query':
        score = 0.82;
        break;
      case 'Cloud':
        score = 0.72;
        break;
      case 'DevOps':
        score = 0.74;
        break;
      case 'Tools & IDEs':
        score = 0.66;
        break;
      case 'AI & ML':
        score = 0.72;
        break;
      case 'Design':
        score = 0.7;
        break;
      case 'Other':
        score = 0.56;
        break;
      case 'Languages':
      default:
        score = 0.64;
        break;
    }

    connectCategoryToCategories(
      bucketMap,
      sourceCategory,
      targetCategories,
      score,
      'Category-level ecosystem pairing',
      9
    );
  }
}

function applyExplicitStackRules(bucketMap: Map<string, Map<string, EdgeBucket>>): void {
  applyCuratedRules(bucketMap, buildCuratedRules());
}

function buildDependencyGraph(): Record<string, GraphNode> {
  const bucketMap = new Map<string, Map<string, EdgeBucket>>();

  applyExplicitStackRules(bucketMap);

  applyLanguageFamilies(bucketMap);

  applySameCategoryRules(bucketMap);

  applyCategoryRelations(bucketMap);

  const graph: Record<string, GraphNode> = {};

  for (const tech of TECHNOLOGIES) {
    const bucket = bucketMap.get(tech.id) ?? new Map<string, EdgeBucket>();

    const edges = [...bucket.values()]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.targetId.localeCompare(b.targetId);
      })
      .slice(0, 24)
      .map<GraphEdge>((edge) => ({
        targetId: edge.targetId,
        score: Math.max(0, Math.min(1, edge.score)),
        strength: strengthFromScore(edge.score),
        category: edge.category,
        reasons: [...edge.reasons],
      }));

    graph[tech.id] = {
      id: tech.id,
      edges,
    };
  }

  return graph;
}

export const DEPENDENCY_GRAPH: Record<string, GraphNode> = buildDependencyGraph();
