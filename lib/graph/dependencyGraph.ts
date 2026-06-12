import type { GraphNode } from './types';

export const DEPENDENCY_GRAPH: Record<string, GraphNode> = {
  react: {
    id: 'react',
    edges: [
      {
        targetId: 'nextjs',
        score: 0.8,
        strength: 'strong',
        category: 'Frontend',
        reasons: [
          'Popular framework for React',
          'Official React recommendation for building apps',
          'Supports React Server Components out of the box',
        ],
      },
      {
        targetId: 'tailwindcss',
        score: 0.9,
        strength: 'strong',
        category: 'Styling',
        reasons: [
          'Highly popular utility-first CSS library with React developers',
          'Strong ecosystem integration with Tailwind classes',
        ],
      },
      {
        targetId: 'typescript',
        score: 0.85,
        strength: 'strong',
        category: 'Tooling',
        reasons: [
          'Provides type safety for React props and state',
          'Industry standard for modern React applications',
        ],
      },
      {
        targetId: 'shadcnui',
        score: 0.85,
        strength: 'strong',
        category: 'Styling',
        reasons: [
          'Highly customizable UI components designed for React and Tailwind',
          'Modern design library of copy-paste components',
        ],
      },
      {
        targetId: 'framermotion',
        score: 0.75,
        strength: 'strong',
        category: 'Styling',
        reasons: ['The most popular physics-based animation library for React'],
      },
      {
        targetId: 'storybook',
        score: 0.65,
        strength: 'moderate',
        category: 'Tooling',
        reasons: ['Isolate and document React components during development'],
      },
    ],
  },
  nodejs: {
    id: 'nodejs',
    edges: [
      {
        targetId: 'nextjs',
        score: 0.75,
        strength: 'strong',
        category: 'Frontend',
        reasons: [
          'Uses Node.js runtime for server-side rendering',
          'Seamless full-stack javascript/typescript experience',
        ],
      },
      {
        targetId: 'express',
        score: 0.85,
        strength: 'strong',
        category: 'Backend',
        reasons: [
          'De-facto standard web framework for Node.js',
          'Massive middleware ecosystem and community support',
        ],
      },
      {
        targetId: 'mongodb',
        score: 0.8,
        strength: 'strong',
        category: 'Database',
        reasons: [
          'Popular document database for Node.js applications',
          'Core part of the popular MERN/MEAN tech stacks',
        ],
      },
      {
        targetId: 'postgresql',
        score: 0.75,
        strength: 'strong',
        category: 'Database',
        reasons: [
          'Robust relational database for Node.js backends',
          'Excellent support from popular Node ORMs like Prisma',
        ],
      },
      {
        targetId: 'typescript',
        score: 0.7,
        strength: 'moderate',
        category: 'Tooling',
        reasons: ['Provides type-safety for Node.js backend logic'],
      },
      {
        targetId: 'nestjs',
        score: 0.7,
        strength: 'strong',
        category: 'Backend',
        reasons: [
          'Structured progressive Node.js framework',
          'Enforces modular design and clean architecture',
        ],
      },
      {
        targetId: 'fastify',
        score: 0.65,
        strength: 'moderate',
        category: 'Backend',
        reasons: ['High-performance, low-overhead framework for Node.js APIs'],
      },
    ],
  },
  nextjs: {
    id: 'nextjs',
    edges: [
      {
        targetId: 'react',
        score: 1.0,
        strength: 'strong',
        category: 'Frontend',
        reasons: [
          'Next.js is a React-based framework',
          'Utilizes React components as its primary building block',
        ],
      },
      {
        targetId: 'tailwindcss',
        score: 0.95,
        strength: 'strong',
        category: 'Styling',
        reasons: [
          'Directly supported and pre-configured in Next.js templates',
          'Highly recommended for styling Next.js applications',
        ],
      },
      {
        targetId: 'typescript',
        score: 0.9,
        strength: 'strong',
        category: 'Tooling',
        reasons: [
          'First-class TypeScript support built-in',
          'Provides type safety for routing, API routes, and Server Actions',
        ],
      },
      {
        targetId: 'prisma',
        score: 0.8,
        strength: 'strong',
        category: 'Database',
        reasons: [
          'Excellent type-safe ORM for Next.js databases',
          'Highly recommended for writing database queries in Server Actions',
        ],
      },
      {
        targetId: 'supabase',
        score: 0.82,
        strength: 'strong',
        category: 'Database',
        reasons: [
          'Great backend-as-a-service matching Next.js serverless functions',
          'Provides built-in authentication and real-time database capabilities',
        ],
      },
      {
        targetId: 'vercel',
        score: 0.95,
        strength: 'strong',
        category: 'Tooling',
        reasons: [
          'Optimized hosting platform built by the creators of Next.js',
          'Seamless integration, zero-config deployments, and global CDN',
        ],
      },
    ],
  },
  typescript: {
    id: 'typescript',
    edges: [
      {
        targetId: 'react',
        score: 0.8,
        strength: 'strong',
        category: 'Frontend',
        reasons: ['Enables type-safe React UI components'],
      },
      {
        targetId: 'nextjs',
        score: 0.85,
        strength: 'strong',
        category: 'Frontend',
        reasons: ['Leverages full end-to-end type safety in Next.js applications'],
      },
      {
        targetId: 'nodejs',
        score: 0.7,
        strength: 'moderate',
        category: 'Backend',
        reasons: ['Provides compile-time verification for backend javascript runtimes'],
      },
    ],
  },
  python: {
    id: 'python',
    edges: [
      {
        targetId: 'fastapi',
        score: 0.85,
        strength: 'strong',
        category: 'Backend',
        reasons: [
          'Modern high-performance web framework for Python APIs',
          'Leverages Python type hints for data validation',
        ],
      },
      {
        targetId: 'django',
        score: 0.8,
        strength: 'strong',
        category: 'Backend',
        reasons: [
          'Batteries-included full-stack Python framework',
          'Provides standard ORM, migrations, and built-in admin panel',
        ],
      },
      {
        targetId: 'flask',
        score: 0.75,
        strength: 'strong',
        category: 'Backend',
        reasons: ['Lightweight and modular micro web framework for Python applications'],
      },
      {
        targetId: 'postgresql',
        score: 0.7,
        strength: 'strong',
        category: 'Database',
        reasons: ['Standard choice for Django and FastAPI databases in production'],
      },
      {
        targetId: 'sqlite',
        score: 0.6,
        strength: 'moderate',
        category: 'Database',
        reasons: ['Local file-based database for quick Python prototyping'],
      },
    ],
  },
  go: {
    id: 'go',
    edges: [
      {
        targetId: 'gin',
        score: 0.85,
        strength: 'strong',
        category: 'Backend',
        reasons: ['Extremely fast HTTP web framework for Go-based API backends'],
      },
      {
        targetId: 'docker',
        score: 0.8,
        strength: 'strong',
        category: 'Tooling',
        reasons: [
          'Go binaries are statically compiled and run perfectly in scratch Docker containers',
        ],
      },
      {
        targetId: 'kubernetes',
        score: 0.85,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Kubernetes is built in Go and fits Go engineering pipelines naturally'],
      },
    ],
  },
  rust: {
    id: 'rust',
    edges: [
      {
        targetId: 'actix',
        score: 0.8,
        strength: 'strong',
        category: 'Backend',
        reasons: ['Blazing fast actor-based web framework for building Rust microservices'],
      },
      {
        targetId: 'webassembly',
        score: 0.75,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Rust compiles seamlessly into WASM for high performance browser execution'],
      },
      {
        targetId: 'docker',
        score: 0.75,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Statically linked Rust binaries create ultra-small, secure container images'],
      },
    ],
  },
  tailwindcss: {
    id: 'tailwindcss',
    edges: [
      {
        targetId: 'shadcnui',
        score: 0.85,
        strength: 'strong',
        category: 'Styling',
        reasons: [
          'Design collection built on Tailwind classes for easy styling customization',
          'Saves styling setup time using pre-built Tailwind primitives',
        ],
      },
      {
        targetId: 'framermotion',
        score: 0.7,
        strength: 'moderate',
        category: 'Styling',
        reasons: ['Great tool for animating Tailwind transitions and hover states'],
      },
    ],
  },
  postgresql: {
    id: 'postgresql',
    edges: [
      {
        targetId: 'prisma',
        score: 0.75,
        strength: 'strong',
        category: 'Database',
        reasons: ['Popular type-safe ORM for relational databases like PostgreSQL'],
      },
      {
        targetId: 'supabase',
        score: 0.8,
        strength: 'strong',
        category: 'Database',
        reasons: ['Postgres-centric backend as a service providing instant API layer and auth'],
      },
      {
        targetId: 'docker',
        score: 0.75,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Easily spin up a local PostgreSQL instance in a container during development'],
      },
    ],
  },
  mongodb: {
    id: 'mongodb',
    edges: [
      {
        targetId: 'mongoose',
        score: 0.9,
        strength: 'strong',
        category: 'Database',
        reasons: ['Standard schema-based modeling tool for MongoDB in JavaScript projects'],
      },
      {
        targetId: 'express',
        score: 0.8,
        strength: 'strong',
        category: 'Backend',
        reasons: ['Standard choice for RESTful MongoDB backends (MEAN/MERN stack)'],
      },
    ],
  },
  javascript: {
    id: 'javascript',
    edges: [
      {
        targetId: 'react',
        score: 0.85,
        strength: 'strong',
        category: 'Frontend',
        reasons: [
          'Most popular UI library built on JavaScript',
          'Dominant choice for building modern interactive web applications',
        ],
      },
      {
        targetId: 'nodejs',
        score: 0.8,
        strength: 'strong',
        category: 'Backend',
        reasons: [
          'Run JavaScript on the server with Node.js',
          'Enables full-stack JavaScript development',
        ],
      },
      {
        targetId: 'typescript',
        score: 0.9,
        strength: 'strong',
        category: 'Tooling',
        reasons: [
          'Adds static typing to JavaScript for safer code',
          'Industry standard superset of JavaScript',
        ],
      },
      {
        targetId: 'vuejs',
        score: 0.75,
        strength: 'strong',
        category: 'Frontend',
        reasons: ['Progressive JavaScript framework for building UIs'],
      },
      {
        targetId: 'nextjs',
        score: 0.7,
        strength: 'moderate',
        category: 'Frontend',
        reasons: ['Full-stack React framework powered by JavaScript'],
      },
      {
        targetId: 'express',
        score: 0.7,
        strength: 'moderate',
        category: 'Backend',
        reasons: ['Minimalist JavaScript web framework for building APIs'],
      },
      {
        targetId: 'tailwindcss',
        score: 0.65,
        strength: 'moderate',
        category: 'Styling',
        reasons: ['Popular utility-first CSS framework used with JavaScript projects'],
      },
    ],
  },
  html5: {
    id: 'html5',
    edges: [
      {
        targetId: 'css3',
        score: 0.95,
        strength: 'strong',
        category: 'Styling',
        reasons: ['Standard web presentation layer alongside HTML structure'],
      },
      {
        targetId: 'javascript',
        score: 0.95,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Standard browser scripting language alongside HTML structure'],
      },
    ],
  },
  docker: {
    id: 'docker',
    edges: [
      {
        targetId: 'kubernetes',
        score: 0.85,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Orchestrate and manage multiple Docker containers at scale'],
      },
      {
        targetId: 'githubactions',
        score: 0.8,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Run CI/CD workflows using standardized Docker containers'],
      },
      {
        targetId: 'terraform',
        score: 0.75,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Manage container registry and cloud runtime infrastructure as code'],
      },
      {
        targetId: 'aws',
        score: 0.8,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Deploy docker containers using ECS or EKS services'],
      },
    ],
  },
  aws: {
    id: 'aws',
    edges: [
      {
        targetId: 'terraform',
        score: 0.85,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Most popular tool for provisioning AWS cloud infrastructure safely'],
      },
      {
        targetId: 'docker',
        score: 0.8,
        strength: 'strong',
        category: 'Tooling',
        reasons: ['Containerized application packaging suitable for AWS deployment services'],
      },
    ],
  },
};
