// app/api/dependency/route.ts
// Repository Dependency Intelligence API

import { type NextRequest, NextResponse } from 'next/server';
import type { DependencyData } from '@/types/dependency';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const org = searchParams.get('org');

    if (!repo) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }

    // Generate mock dependency data
    const data = generateMockDependencyData(repo);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dependency API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dependency data' }, { status: 500 });
  }
}

function generateMockDependencyData(repo: string): DependencyData {
  // Generate mock nodes
  const nodeNames = [
    'react',
    'next',
    'typescript',
    'vitest',
    'eslint',
    'prettier',
    'tailwindcss',
    'zod',
    'lucide-react',
    'clsx',
  ];

  const nodes: Array<{ id: string; name: string; version: string; type: 'root' | 'dependency'; health: number; risk: 'low' | 'medium' | 'high' }> = nodeNames.map((name, i) => ({
    id: `node-${i}`,
    name,
    version: `^${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`,
    type: i === 0 ? 'root' : 'dependency',
    health: Math.floor(Math.random() * 40) + 60,
    risk: i < 2 ? 'low' : i < 5 ? 'medium' : 'high',
  }));

  // Generate edges
  const edges = [];
  for (let i = 1; i < Math.min(nodes.length, 6); i++) {
    edges.push({
      source: 'node-0',
      target: `node-${i}`,
      type: 'depends-on' as const,
    });
  }

  // Generate summary
  const summary = {
    total: nodes.length,
    direct: 3,
    transitive: nodes.length - 3,
    outdated: Math.floor(Math.random() * 3),
    vulnerable: Math.floor(Math.random() * 2),
    healthy: nodes.filter((n) => n.health >= 70).length,
  };

  // Generate risk analysis
  const riskAnalysis = [
    {
      id: 'risk-1',
      type: 'outdated' as const,
      severity: 'medium' as const,
      package: 'eslint',
      description: 'Package has a newer major version available',
      recommendation: 'Consider upgrading to the latest version for new features',
    },
    {
      id: 'risk-2',
      type: 'maintenance' as const,
      severity: 'low' as const,
      package: 'lucide-react',
      description: 'Package is actively maintained',
      recommendation: 'Continue using current version',
    },
  ];

  return {
    graph: { nodes, edges },
    summary,
    riskAnalysis,
  };
}
