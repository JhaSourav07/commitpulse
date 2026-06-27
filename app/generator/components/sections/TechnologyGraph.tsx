'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { TECHNOLOGIES } from '../../data/technologies';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TechnologyGraphProps {
  selected: string[];
  onToggle: (id: string) => void;
}

interface NodeState {
  id: string;
  name: string;
  category: string;
  iconUrl: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const GRAPH_NODE_DEFS = [
  { id: 'react', label: 'React' },
  { id: 'nextjs', label: 'Next.js' },
  { id: 'tailwindcss', label: 'Tailwind CSS' },
  { id: 'vite', label: 'Vite' },
  { id: 'nodejs', label: 'Node.js' },
  { id: 'express', label: 'Express' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'nestjs', label: 'NestJS' },
  { id: 'prisma', label: 'Prisma' },
];

const GRAPH_EDGES = [
  { source: 'react', target: 'nextjs' },
  { source: 'react', target: 'tailwindcss' },
  { source: 'react', target: 'vite' },
  { source: 'nodejs', target: 'express' },
  { source: 'nodejs', target: 'mongodb' },
  { source: 'nextjs', target: 'prisma' },
  { source: 'nextjs', target: 'postgresql' },
  // Core compatibility pathways
  { source: 'express', target: 'mongodb' },
  { source: 'prisma', target: 'postgresql' },
  { source: 'nestjs', target: 'postgresql' },
  { source: 'nestjs', target: 'nodejs' },
];

export function TechnologyGraph({ selected, onToggle }: TechnologyGraphProps) {
  const safeSelected = Array.isArray(selected) ? selected : [];
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // Initialize nodes in a neat circle
  const getInitialNodes = (): NodeState[] => {
    const width = 650;
    const height = 400;
    const cx = width / 2;
    const cy = height / 2;
    const r = 150;

    return GRAPH_NODE_DEFS.map((def, index) => {
      const tech = TECHNOLOGIES.find((t) => t.id === def.id);
      const angle = (index / GRAPH_NODE_DEFS.length) * 2 * Math.PI;
      return {
        id: def.id,
        name: tech?.name || def.label,
        category: tech?.category || 'Unknown',
        iconUrl: tech?.iconUrl || '',
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 10,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 10,
        vx: 0,
        vy: 0,
      };
    });
  };

  const nodesRef = useRef<NodeState[]>(getInitialNodes());
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Pan and Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Reset physics layout simulation on component mount or reset
  const resetSimulation = () => {
    nodesRef.current = getInitialNodes();
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Setup nodes state initially
  useEffect(() => {
    setNodes([...nodesRef.current]);
  }, []);

  // Force Directed Graph Simulation Tick
  useEffect(() => {
    const tick = () => {
      const currentNodes = [...nodesRef.current];
      const width = 650;
      const height = 400;
      const cx = width / 2;
      const cy = height / 2;

      // 1. Repulsion between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        const n1 = currentNodes[i];
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n2 = currentNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          // Tweak forces: pull selected nodes closer together or repel unselected
          let forceFactor = 3500;
          if (safeSelected.includes(n1.id) && safeSelected.includes(n2.id)) {
            // Selected nodes have lower repulsion to allow clustering
            forceFactor = 2000;
          }

          const repulsionForce = forceFactor / distSq;
          const fx = (dx / dist) * repulsionForce;
          const fy = (dy / dist) * repulsionForce;

          if (n1.id !== draggedNode) {
            n1.vx -= fx;
            n1.vy -= fy;
          }
          if (n2.id !== draggedNode) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Attraction along edges
      GRAPH_EDGES.forEach((edge) => {
        const n1 = currentNodes.find((n) => n.id === edge.source);
        const n2 = currentNodes.find((n) => n.id === edge.target);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Selected connections pull slightly tighter
        const isBothSelected = safeSelected.includes(n1.id) && safeSelected.includes(n2.id);
        const restLength = isBothSelected ? 90 : 130;
        const k = isBothSelected ? 0.04 : 0.02;

        const force = k * (dist - restLength);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (n1.id !== draggedNode) {
          n1.vx += fx;
          n1.vy += fy;
        }
        if (n2.id !== draggedNode) {
          n2.vx -= fx;
          n2.vy -= fy;
        }
      });

      // 3. Gravity towards center
      currentNodes.forEach((node) => {
        if (node.id === draggedNode) return;

        const dx = cx - node.x;
        const dy = cy - node.y;
        // Nodes not in active selection gravitate slightly more to perimeter/background
        const gravity = safeSelected.includes(node.id) ? 0.012 : 0.008;
        node.vx += dx * gravity;
        node.vy += dy * gravity;
      });

      // 4. Update positions with damping and screen bounds checking
      currentNodes.forEach((node) => {
        if (node.id === draggedNode) return;

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.85; // Damping
        node.vy *= 0.85;

        // Boundaries to prevent flying away
        const padding = 45;
        if (node.x < padding) {
          node.x = padding;
          node.vx = 0;
        }
        if (node.x > width - padding) {
          node.x = width - padding;
          node.vx = 0;
        }
        if (node.y < padding) {
          node.y = padding;
          node.vy = 0;
        }
        if (node.y > height - padding) {
          node.y = height - padding;
          node.vy = 0;
        }
      });

      nodesRef.current = currentNodes;
      setNodes([...currentNodes]);
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [draggedNode, safeSelected]);

  // Handle zooming & panning events
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.6, Math.min(2.5, nextZoom)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (draggedNode) {
      // Scale mouse displacement based on pan/zoom
      const newX = (clientX - pan.x) / zoom;
      const newY = (clientY - pan.y) / zoom;

      nodesRef.current = nodesRef.current.map((n) => {
        if (n.id === draggedNode) {
          return { ...n, x: newX, y: newY, vx: 0, vy: 0 };
        }
        return n;
      });
      setNodes([...nodesRef.current]);
    } else if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUpOrLeave = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  // Node event triggers
  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNode(id);
  };

  const handleNodeClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Do not toggle selection if user was clearly dragging
    if (draggedNode) return;
    onToggle(id);
  };

  // Highlight connections
  const activeAndHoveredConnections = useMemo(() => {
    const activeIds = new Set<string>();

    // If a node is hovered, highlight its immediate connections
    if (hoveredNode) {
      activeIds.add(hoveredNode);
      GRAPH_EDGES.forEach((edge) => {
        if (edge.source === hoveredNode) activeIds.add(edge.target);
        if (edge.target === hoveredNode) activeIds.add(edge.source);
      });
    }

    // Include selected nodes and their immediate connected neighbors
    safeSelected.forEach((selId) => {
      activeIds.add(selId);
      GRAPH_EDGES.forEach((edge) => {
        if (edge.source === selId) activeIds.add(edge.target);
        if (edge.target === selId) activeIds.add(edge.source);
      });
    });

    return activeIds;
  }, [safeSelected, hoveredNode]);

  const isNodeHighlighted = (id: string) => {
    if (safeSelected.length === 0 && !hoveredNode) return true; // Show full color initially
    return activeAndHoveredConnections.has(id);
  };

  return (
    <div className="mt-6 p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-4 h-4 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M9 6h6M9 18h6M6 9v6M18 9v6" />
            </svg>
            Technology Dependency Graph
          </h3>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
            Ecosystem recommendations & compatibility paths. Click to select, drag to arrange.
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(2.5, prev * 1.1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.6, prev / 1.1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={resetSimulation}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Reset Graph Layout"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className="relative w-full h-[400px] rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#090909] overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner"
      >
        {/* Subtle decorative mesh grid in background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Selected counts overlay */}
        <div className="absolute top-3 left-3 pointer-events-none bg-white/75 dark:bg-black/60 backdrop-blur-md border border-gray-100 dark:border-white/5 px-2.5 py-1 rounded-md text-[10px] font-semibold text-gray-600 dark:text-white/70 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{safeSelected.length} Selected Technologies</span>
        </div>

        <svg className="w-full h-full">
          <defs>
            {/* Edge arrowhead markers */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="33"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#cccccc" className="dark:fill-[#333333]" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="33"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>

            {/* Glowing lines filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Group container with current pan & zoom transform */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Draw Relationship Lines (Edges) */}
            {GRAPH_EDGES.map((edge, idx) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const isSourceSelected = safeSelected.includes(edge.source);
              const isTargetSelected = safeSelected.includes(edge.target);
              const isSourceHovered = hoveredNode === edge.source;
              const isTargetHovered = hoveredNode === edge.target;

              const isActive =
                (isSourceSelected && isTargetSelected) ||
                (hoveredNode && (isSourceHovered || isTargetHovered));
              const isSemiActive = isSourceSelected || isTargetSelected;

              // Compute color and styles based on active selection states
              let strokeColor = '#e5e7eb'; // default light mode
              let strokeWidth = 1.5;
              let strokeDash = undefined;
              let marker = 'url(#arrow-default)';

              if (
                typeof window !== 'undefined' &&
                document.documentElement.classList.contains('dark')
              ) {
                strokeColor = '#1f2937'; // default dark mode
              }

              if (isActive) {
                strokeColor = '#10b981'; // vibrant emerald
                strokeWidth = 2.5;
                marker = 'url(#arrow-active)';
              } else if (isSemiActive) {
                strokeColor = '#34d399'; // medium green
                strokeWidth = 2;
                strokeDash = '3 3';
                marker = 'url(#arrow-active)';
              } else if (hoveredNode || safeSelected.length > 0) {
                // Dim non-connected lines when something is selected/hovered
                strokeColor = '#f3f4f6';
                if (
                  typeof window !== 'undefined' &&
                  document.documentElement.classList.contains('dark')
                ) {
                  strokeColor = '#111827';
                }
                strokeWidth = 1;
              }

              return (
                <g key={`edge-${idx}`}>
                  {/* Glowing backing line for highlighted connections */}
                  {isActive && (
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="#10b981"
                      strokeWidth={6}
                      strokeOpacity={0.25}
                      filter="url(#glow)"
                    />
                  )}
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={marker}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}

            {/* Draw Technology Bubble Cards (Nodes) */}
            {nodes.map((node) => {
              const isSelected = safeSelected.includes(node.id);
              const isHovered = hoveredNode === node.id;
              const isHighlighted = isNodeHighlighted(node.id);

              // Scale bubble size if highlighted/selected
              const radius = isSelected ? 26 : 24;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer selection ring animation */}
                  {isSelected && (
                    <circle
                      r={radius + 6}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                      className="animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                  )}

                  {/* Outer node border shadow / highlight */}
                  <circle
                    r={radius + 2}
                    fill={isSelected ? '#10b981' : isHovered ? '#64748b' : 'transparent'}
                    fillOpacity={isSelected ? 0.15 : 0.08}
                    stroke={isSelected ? '#10b981' : isHovered ? '#10b981' : '#e2e8f0'}
                    strokeWidth={isSelected || isHovered ? 2.5 : 1}
                    className="dark:stroke-[#222222] transition-all duration-300"
                    style={{
                      stroke: isSelected ? '#10b981' : isHovered ? '#10b981' : undefined,
                      opacity: isHighlighted ? 1 : 0.25,
                    }}
                  />

                  {/* Node solid circle card (Glassmorphism effect) */}
                  <circle
                    r={radius}
                    fill="#ffffff"
                    className="dark:fill-[#161616]"
                    style={{
                      opacity: isHighlighted ? 1 : 0.25,
                    }}
                  />

                  {/* Technology Icon Image */}
                  {node.iconUrl && (
                    <image
                      href={node.iconUrl}
                      x={-12}
                      y={-14}
                      width={24}
                      height={24}
                      className="pointer-events-none"
                      style={{
                        opacity: isHighlighted ? 1 : 0.2,
                      }}
                      onError={(e) => {
                        // Hide broken devicon/jsdelivr images gracefully
                        (e.currentTarget as SVGImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  {/* Technology Label Text */}
                  <text
                    y={radius + 15}
                    textAnchor="middle"
                    className={`text-[9px] font-bold tracking-wide transition-all duration-300 pointer-events-none ${
                      isSelected
                        ? 'fill-emerald-600 dark:fill-emerald-400 font-extrabold'
                        : 'fill-gray-700 dark:fill-white/80'
                    }`}
                    style={{
                      opacity: isHighlighted ? 1 : 0.25,
                    }}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
