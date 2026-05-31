'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Star, GitFork, Clock, Box } from 'lucide-react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const FILTER_COLORS = {
  Personal: '#3B82F6', // Blue
  Contributions: '#22C55E', // Green
  Forks: '#F97316', // Orange
};

import { GraphNode, GraphLink } from '@/types';

interface RepositoryGraphProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

export default function RepositoryGraph({ data }: RepositoryGraphProps) {
  const [filters, setFilters] = useState({
    Personal: true,
    Contributions: true,
    Forks: true,
  });

  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: Math.max(400, window.innerHeight * 0.45),
      });

      const handleResize = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: Math.max(400, window.innerHeight * 0.45),
          });
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Filter Data
  const graphData = useMemo(() => {
    const activeTypes = new Set<string>(['User']);
    if (filters.Personal) activeTypes.add('Repo');
    if (filters.Contributions) activeTypes.add('Contribution');
    if (filters.Forks) activeTypes.add('Fork');

    const filteredNodes = data.nodes.filter((node) => activeTypes.has(node.type));
    const validNodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = data.links.filter(
      (link) =>
        validNodeIds.has(
          typeof link.source === 'object' ? link.source.id : (link.source as string)
        ) &&
        validNodeIds.has(typeof link.target === 'object' ? link.target.id : (link.target as string))
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filters]);

  // Insights
  const insights = useMemo(() => {
    if (!data.nodes || data.nodes.length === 0) return null;

    let mostStarred = null;
    let highestContribution = null;
    let reposCount = 0;

    for (const node of data.nodes) {
      if (node.type === 'Repo' || node.type === 'Fork') reposCount++;
      if (!mostStarred || (node.stats?.stars || 0) > (mostStarred.stats?.stars || 0)) {
        if (node.type !== 'User') mostStarred = node;
      }
      if (
        node.type === 'Contribution' &&
        (!highestContribution || (node.stats?.stars || 0) > (highestContribution.stats?.stars || 0))
      ) {
        highestContribution = node;
      }
    }

    return {
      reposCount,
      mostStarred,
      highestContribution,
    };
  }, [data]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  }, []);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!data || data.nodes.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-300 dark:border-zinc-800 rounded-xl text-gray-500">
        <Box className="w-12 h-12 mb-4 opacity-50" />
        <p>No repository relationship data available yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" id="repository-graph">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🌐 Repository Dependency Graph
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Visualize your GitHub ecosystem and contribution network.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => (
            <button
              key={key}
              onClick={() => toggleFilter(key as keyof typeof filters)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                value
                  ? 'text-black border-transparent shadow-sm'
                  : 'bg-transparent text-gray-500 border-gray-300 dark:border-zinc-700 hover:border-gray-500'
              }`}
              style={{
                backgroundColor: value
                  ? FILTER_COLORS[key as keyof typeof FILTER_COLORS]
                  : undefined,
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 relative">
        {/* Graph Container */}
        <div
          ref={containerRef}
          className="flex-grow bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden relative shadow-sm"
          style={{ height: dimensions.height }}
        >
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: Record<string, unknown>) => String(node.color || '')}
            nodeRelSize={1}
            nodeVal={(node: Record<string, unknown>) => Number(node.val || 0)}
            onNodeClick={(node: Record<string, unknown>) =>
              handleNodeClick(node as unknown as GraphNode)
            }
            onNodeHover={(node: Record<string, unknown> | null) =>
              setHoverNode((node as unknown as GraphNode) || null)
            }
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={() => 0.005}
            linkColor={() => 'rgba(150, 150, 150, 0.2)'}
            backgroundColor="transparent"
          />

          {/* Custom Hover Tooltip overlay to keep it out of canvas for better styling */}
          {hoverNode && (
            <div className="absolute top-4 left-4 pointer-events-none bg-black/90 dark:bg-white/90 backdrop-blur-sm text-white dark:text-black p-4 rounded-xl shadow-xl z-10 w-64 border border-white/10 dark:border-black/10 transition-opacity">
              <h4 className="font-bold text-base mb-1 truncate">{hoverNode.name}</h4>
              <p className="text-xs uppercase tracking-wider opacity-70 mb-3">{hoverNode.type}</p>

              {hoverNode.stats && (
                <div className="space-y-2 text-sm">
                  {hoverNode.stats.stars !== undefined && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{hoverNode.stats.stars} Stars</span>
                    </div>
                  )}
                  {hoverNode.stats.forks !== undefined && (
                    <div className="flex items-center gap-2">
                      <GitFork className="w-4 h-4 opacity-70" />
                      <span>{hoverNode.stats.forks} Forks</span>
                    </div>
                  )}
                  {hoverNode.stats.language && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400" />
                      <span>{hoverNode.stats.language}</span>
                    </div>
                  )}
                  {hoverNode.stats.updatedAt && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20 dark:border-black/20 text-xs opacity-70">
                      <Clock className="w-3 h-3" />
                      <span>
                        Updated: {new Date(hoverNode.stats.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel (Desktop) */}
        <div className="lg:w-80 flex flex-col gap-6 hidden lg:flex">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-sm hidden lg:block">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Graph Insights</h3>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Ecosystem Size
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {insights?.reposCount} Repositories connected
                </p>
              </div>

              {insights?.mostStarred && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    🌟 Most Starred
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {insights.mostStarred.name} ({insights.mostStarred.stats?.stars} stars)
                  </p>
                </div>
              )}

              {insights?.highestContribution && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    ⚡ Top Contribution
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {insights.highestContribution.name}
                  </p>
                </div>
              )}

              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-zinc-800">
                <p className="text-xs text-gray-500 text-center">
                  Hover over any node to view detailed statistics, and click to zoom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
