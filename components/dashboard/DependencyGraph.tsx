'use client';

// components/dashboard/DependencyGraph.tsx
// Dependency Graph Visualization

import { useTranslation } from '@/context/TranslationContext';
import type { DependencyNode, DependencyEdge } from '@/types/dependency';

interface DependencyGraphProps {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  onNodeSelect?: (node: DependencyNode) => void;
}

export default function DependencyGraph({ nodes, edges, onNodeSelect }: DependencyGraphProps) {
  const { t } = useTranslation();

  const getNodeColor = (node: DependencyNode) => {
    if (node.type === 'root') return 'bg-blue-500';
    switch (node.risk) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600 dark:text-green-400';
    if (health >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Calculate positions in a circular layout
  const getNodePosition = (index: number, total: number, radius: number) => {
    if (total <= 1) return { x: 200, y: 200 };
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
    };
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="bg-default-50 dark:bg-default-900 rounded-lg p-8 text-center">
        <p className="text-default-500">{t('dashboard.dependency.no_dependencies')}</p>
      </div>
    );
  }

  return (
    <section
      className="bg-default-50 dark:bg-default-900 rounded-lg p-4"
      aria-labelledby="dependency-graph-title"
    >
      <h3 id="dependency-graph-title" className="text-lg font-semibold mb-4">
        {t('dashboard.dependency.graph')}
      </h3>

      <div className="relative overflow-auto" role="img" aria-label="Dependency relationship graph">
        <svg viewBox="0 0 400 400" className="w-full h-auto min-h-[300px]" aria-hidden="true">
          {/* Edges */}
          {edges.map((edge, i) => {
            const sourceIndex = nodes.findIndex((n) => n.id === edge.source);
            const targetIndex = nodes.findIndex((n) => n.id === edge.target);
            if (sourceIndex === -1 || targetIndex === -1) return null;

            const sourcePos = getNodePosition(sourceIndex, nodes.length, 120);
            const targetPos = getNodePosition(targetIndex, nodes.length, 120);

            return (
              <line
                key={i}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                className="stroke-default-300 dark:stroke-default-700"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                className="fill-default-400 dark:fill-default-600"
              />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((node, i) => {
            const pos = getNodePosition(i, nodes.length, 120);
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => onNodeSelect?.(node)}
                role="button"
                aria-label={`${node.name} ${node.version}`}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="30"
                  className={`${getNodeColor(node)} transition-colors hover:opacity-80`}
                />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  className="fill-white text-xs font-medium pointer-events-none"
                >
                  {node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-500" aria-hidden="true" />
          <span>{t('dashboard.dependency.root')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-green-500" aria-hidden="true" />
          <span>{t('dashboard.dependency.low_risk')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-yellow-500" aria-hidden="true" />
          <span>{t('dashboard.dependency.medium_risk')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-red-500" aria-hidden="true" />
          <span>{t('dashboard.dependency.high_risk')}</span>
        </div>
      </div>

      {/* Data table for accessibility */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-default-600 dark:text-default-400">
          {t('dashboard.dependency.view_table')}
        </summary>
        <table className="w-full mt-2 text-sm">
          <thead>
            <tr>
              <th className="text-left">{t('dashboard.dependency.package')}</th>
              <th className="text-right">{t('dashboard.dependency.version')}</th>
              <th className="text-right">{t('dashboard.dependency.type')}</th>
              <th className="text-right">{t('dashboard.dependency.health')}</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id} className="border-t border-default-200 dark:border-default-800">
                <td className="py-1">{node.name}</td>
                <td className="text-right">{node.version}</td>
                <td className="text-right capitalize">{node.type}</td>
                <td className={`text-right ${getHealthColor(node.health)}`}>{node.health}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
