'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  GitBranch,
  Sparkles,
  Folder,
  File,
  ChevronRight,
  Layers,
  Network,
  FileText,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  type Node as FlowNode,
  type Edge as FlowEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node: Folder
const FolderNodeRenderer = ({ data }: { data: { label: string } }) => {
  return (
    <div className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/75 backdrop-blur-md shadow-md flex items-center gap-2 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-200 cursor-grab active:cursor-grabbing w-44">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <span className="text-sm shrink-0">📁</span>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
          {data.label}
        </span>
        <span className="text-[9px] text-gray-500 uppercase tracking-widest">Folder</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// Custom Node: File
const FileNodeRenderer = ({
  data,
}: {
  data: { label: string; type: string; linesOfCode: number };
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'tsx':
      case 'jsx':
        return '⚛️';
      case 'ts':
      case 'js':
        return '🟨';
      case 'css':
        return '🎨';
      case 'json':
        return '⚙️';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/75 backdrop-blur-md shadow-md flex items-center gap-2 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 cursor-grab active:cursor-grabbing w-44">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <span className="text-sm shrink-0">{getIcon(data.type)}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
          {data.label}
        </span>
        <span className="text-[9px] text-gray-500 dark:text-white/40">
          {data.linesOfCode} lines
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = {
  folderNode: FolderNodeRenderer,
  fileNode: FileNodeRenderer,
};

interface FileMetric {
  name: string;
  path: string;
  size: number;
  linesOfCode: number;
  commits: number;
  lastModified: string;
  contributors: string[];
  imports: string[];
  exports: string[];
}

// Types for collapsible folder tree
interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  data?: FileMetric;
}

function buildTree(files: FileMetric[], folders: string[]): TreeNode {
  const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };

  folders.forEach((f) => {
    const parts = f.split('/');
    let current = root;
    let currentPath = '';

    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let existing = current.children.find((child) => child.path === currentPath);
      if (!existing) {
        existing = { name: part, path: currentPath, isFolder: true, children: [] };
        current.children.push(existing);
      }
      current = existing;
    });
  });

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      let existing = current.children.find((child) => child.path === currentPath);
      if (!existing) {
        existing = { name: parts[i], path: currentPath, isFolder: true, children: [] };
        current.children.push(existing);
      }
      current = existing;
    }

    current.children.push({
      name: file.name,
      path: file.path,
      isFolder: false,
      children: [],
      data: file,
    });
  });

  // Sort children: Folders first, then Files alphabetically
  const sortTree = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortTree);
  };
  sortTree(root);

  return root;
}

// Collapsible tree node component
const FolderTreeNode = ({
  node,
  onNodeClick,
  activeNodePath,
}: {
  node: TreeNode;
  onNodeClick: (data?: FileMetric) => void;
  activeNodePath?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!node.isFolder) {
    const isActive = activeNodePath === node.path;
    return (
      <div
        onClick={() => onNodeClick(node.data)}
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer text-xs transition-colors ${
          isActive
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
      >
        <File size={13} className={isActive ? 'text-emerald-500' : 'text-gray-400'} />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div className="pl-2.5">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-1 px-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-200"
      >
        {isOpen ? (
          <ChevronDown size={13} className="text-gray-400" />
        ) : (
          <ChevronRight size={13} className="text-gray-400" />
        )}
        <Folder size={13} className="text-purple-400 fill-purple-400/10" />
        <span className="truncate">{node.name}</span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden border-l border-black/5 dark:border-white/5 ml-2 pl-1.5 space-y-0.5"
          >
            {node.children.map((child) => (
              <FolderTreeNode
                key={child.path}
                node={child}
                onNodeClick={onNodeClick}
                activeNodePath={activeNodePath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SelectedNodeData {
  name: string;
  path: string;
  isFolder: boolean;
  size?: number;
  linesOfCode?: number;
  commits?: number;
  lastModified?: string;
  contributors?: string[];
  imports?: string[];
  exports?: string[];
}

interface ArchitectureVisualizerProps {
  onClose?: () => void;
}

export default function ArchitectureVisualizer({ onClose }: ArchitectureVisualizerProps) {
  const [mounted, setMounted] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Visualizer data
  const [data, setData] = useState<{
    nodes: FlowNode[];
    edges: FlowEdge[];
    files: FileMetric[];
    folders: string[];
    summary: string;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'tree' | 'dependencies' | 'summary'>(
    'architecture'
  );
  const [fullscreen, setFullscreen] = useState(false);

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  const loadingSteps = [
    'Fetching repository...',
    'Reading folders...',
    'Parsing imports...',
    'Detecting dependencies...',
    'Building graph...',
    'Generating explanation...',
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Sync React Flow nodes/edges when backend data changes
  useEffect(() => {
    if (data) {
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    }
  }, [data, setNodes, setEdges]);

  // Collapsible Tree structure memo
  const treeRoot = useMemo(() => {
    if (!data) return null;
    return buildTree(data.files || [], data.folders || []);
  }, [data]);

  // Run generation process
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setData(null);
    setSelectedNode(null);
    setLoadingStep(0);

    // Simulated step transitions for user loading indicators
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    try {
      const response = await fetch('/api/architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status} Error`);
      }

      const result = await response.json();
      clearInterval(interval);
      setData(result);
      toast.success('Architecture graph successfully generated!');
    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'Failed to read or analyze repository.');
      toast.error('Failed to generate architecture.');
    } finally {
      setIsLoading(false);
    }
  };

  // Node click selection in React Flow
  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
    if (node.type === 'fileNode') {
      setSelectedNode({
        ...(node.data as unknown as FileMetric),
        isFolder: false,
      });
    } else {
      const dataLabel = (node.data as { label?: string })?.label || '';
      const dataPath = (node.data as { path?: string })?.path || '';
      setSelectedNode({
        name: dataLabel,
        path: dataPath,
        isFolder: true,
      });
    }
  }, []);

  const handleTreeFileClick = (fileData?: FileMetric) => {
    if (fileData) {
      setSelectedNode({
        ...fileData,
        isFolder: false,
      });
    }
  };

  const handleReset = () => {
    setData(null);
    setRepoUrl('');
    setError(null);
    setSelectedNode(null);
  };

  const formattedSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!mounted) return null;

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={`rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm overflow-hidden flex flex-col relative transition-all duration-300 ${
        fullscreen
          ? 'fixed inset-4 z-50 bg-white dark:bg-[#050505] shadow-2xl border-purple-500/20'
          : 'w-full min-h-[360px] h-full'
      }`}
      style={{ height: fullscreen ? 'calc(100vh - 32px)' : '100%' }}
    >
      {/* Visualizer Header */}
      <div className="p-5 border-b border-black/10 dark:border-white/5 flex items-center justify-between shrink-0 bg-transparent flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-lg text-white">
            <Network size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
              🧠 Architecture Visualizer
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
              Generate an interactive architecture map of any GitHub repository in seconds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <>
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-[#A1A1AA] transition-colors"
                title={fullscreen ? 'Exit Fullscreen' : 'Maximize'}
              >
                {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-[#A1A1AA] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Container Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* 1. EMPTY STATE */}
          {!data && !isLoading && !error && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="p-8 flex flex-col items-center justify-center text-center flex-1"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 text-2xl border border-purple-500/20">
                🧠
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                Visualize Repository Architecture
              </h4>
              <p className="text-xs text-gray-500 dark:text-white/50 max-w-sm mt-1 mb-6 leading-relaxed">
                Paste a GitHub repository URL to generate a dependency graph and project structure
                visualization.
              </p>

              <form onSubmit={handleGenerate} className="w-full max-w-md flex flex-col gap-3">
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 dark:text-white/40">
                    <GitBranch size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-900 dark:text-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  ✨ Generate Architecture
                </button>
              </form>
            </motion.div>
          )}

          {/* 2. LOADING STATE */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center justify-center flex-1"
            >
              <div className="w-10 h-10 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-6" />
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                {loadingSteps[loadingStep]}
              </h4>

              {/* Progress steps list */}
              <div className="w-full max-w-xs mt-6 space-y-2.5 text-xs text-gray-500 dark:text-[#A1A1AA]">
                {loadingSteps.map((step, idx) => {
                  const isDone = idx < loadingStep;
                  const isCurrent = idx === loadingStep;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                            : isCurrent
                              ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30 animate-pulse'
                              : 'bg-gray-100 dark:bg-white/5 text-transparent border border-black/5 dark:border-white/5'
                        }`}
                      >
                        {isDone && '✓'}
                      </span>
                      <span
                        className={isCurrent ? 'text-gray-900 dark:text-white font-medium' : ''}
                      >
                        {step.replace('...', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 3. ERROR STATE */}
          {error && !isLoading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center justify-center text-center flex-1"
            >
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mb-4">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Analysis Failed</h4>
              <p className="text-xs text-red-600 dark:text-red-400/90 mt-1.5 mb-6 max-w-xs leading-relaxed">
                {error}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all"
                >
                  Go Back
                </button>
                <form onSubmit={handleGenerate}>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Retry Analysis
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* 4. OUTPUT CONTAINER (TABS) */}
          {data && !isLoading && (
            <motion.div
              key="output"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tabs list */}
              <div className="px-5 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-900/10 flex items-center gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
                {(
                  [
                    { id: 'architecture', label: 'Architecture', icon: Network },
                    { id: 'tree', label: 'Folder Tree', icon: Folder },
                    { id: 'dependencies', label: 'Dependencies', icon: Layers },
                    { id: 'summary', label: 'Summary', icon: FileText },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative py-3.5 px-3 flex items-center gap-1.5 text-xs font-semibold transition-all border-b-2 outline-none cursor-pointer ${
                        isActive
                          ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                          : 'border-transparent text-gray-500 dark:text-[#A1A1AA] hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab views content */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* TAB 1: ARCHITECTURE NETWORK GRAPH */}
                {activeTab === 'architecture' && (
                  <div className="flex-1 flex overflow-hidden relative min-h-[400px]">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onNodeClick={onNodeClick}
                      fitView
                      minZoom={0.2}
                      maxZoom={4}
                      colorMode="dark"
                    >
                      <Background color="#555" gap={16} size={1} />
                      <Controls
                        showInteractive={false}
                        className="dark:bg-[#111] dark:border-white/10 dark:text-white"
                      />
                      <MiniMap
                        nodeColor={(n: FlowNode) =>
                          n.type === 'folderNode' ? '#c084fc' : '#34d399'
                        }
                        maskColor="rgba(0, 0, 0, 0.4)"
                        className="dark:bg-[#111] dark:border-white/10 border-black/10"
                      />
                    </ReactFlow>

                    {/* Quick instructions indicator overlay */}
                    <div className="absolute bottom-4 left-4 bg-white/85 dark:bg-[#111]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-[10px] text-gray-500 dark:text-[#A1A1AA] pointer-events-none select-none">
                      💡 Click a file node to view detailed file parameters
                    </div>
                  </div>
                )}

                {/* TAB 2: RECURSIVE COLLAPSIBLE FILE TREE */}
                {activeTab === 'tree' && (
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-[400px]">
                    <div className="max-w-md border border-black/10 dark:border-white/10 rounded-xl p-4 bg-gray-50/50 dark:bg-black/35">
                      {treeRoot &&
                        treeRoot.children.map((child) => (
                          <FolderTreeNode
                            key={child.path}
                            node={child}
                            onNodeClick={handleTreeFileClick}
                            activeNodePath={selectedNode?.path}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: DEPENDENCY RELATIONSHIPS FLOW */}
                {activeTab === 'dependencies' && (
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3 min-h-[400px]">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
                      Code imports mapping
                    </h4>

                    {data.files && data.files.filter((f) => f.imports.length > 0).length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-500 dark:text-white/40">
                        No internal import dependencies detected in analyzed files.
                      </div>
                    ) : (
                      data.files &&
                      data.files
                        .filter((f) => f.imports.length > 0)
                        .map((file) => (
                          <div
                            key={file.path}
                            className="p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-900/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                          >
                            <div className="w-full md:w-1/3 min-w-0">
                              <span className="text-[9px] text-gray-400 uppercase tracking-widest block mb-0.5">
                                File Node
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-white truncate block">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-[#A1A1AA] block truncate">
                                {file.path}
                              </span>
                            </div>

                            <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-bold self-center">
                              <ArrowRight size={14} />
                            </div>

                            <div className="w-full md:w-1/2 min-w-0">
                              <span className="text-[9px] text-gray-400 uppercase tracking-widest block mb-0.5">
                                Imports ({file.imports.length})
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {file.imports.map((imp: string) => (
                                  <span
                                    key={imp}
                                    className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5 font-mono text-[9px] text-gray-600 dark:text-gray-300 truncate max-w-[180px]"
                                    title={imp}
                                  >
                                    {imp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* TAB 4: ARCHITECTURAL SUMMARY DESCRIPTION */}
                {activeTab === 'summary' && (
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-[400px]">
                    <div className="max-w-2xl p-6 rounded-xl border border-black/5 dark:border-white/5 bg-gradient-to-tr from-gray-50 to-white dark:from-zinc-900/30 dark:to-transparent shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-purple-500" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          Architectural Assessment
                        </h4>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-[#A1A1AA] leading-relaxed whitespace-pre-line space-y-4">
                        {data.summary}
                      </div>
                    </div>
                  </div>
                )}

                {/* NODE DETAILS SIDE PANEL (Slides out inside canvas area) */}
                <AnimatePresence>
                  {selectedNode && (
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      className="absolute right-0 top-0 bottom-0 w-80 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md border-l border-black/10 dark:border-white/10 p-5 shadow-2xl z-20 overflow-y-auto flex flex-col justify-between custom-scrollbar"
                    >
                      <div>
                        {/* Header details */}
                        <div className="flex items-start justify-between mb-5">
                          <div className="min-w-0">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">
                              {selectedNode.isFolder ? 'Folder' : 'File Spec'}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                              {selectedNode.name}
                            </h4>
                            <p className="text-[10px] text-gray-500 dark:text-[#A1A1AA] truncate mt-1">
                              {selectedNode.path}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedNode(null)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500"
                          >
                            ×
                          </button>
                        </div>

                        {/* File metrics stats */}
                        {!selectedNode.isFolder && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                                <span className="text-[9px] text-gray-500 block uppercase font-medium">
                                  File Size
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white block mt-0.5">
                                  {formattedSize(selectedNode.size || 0)}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                                <span className="text-[9px] text-gray-500 block uppercase font-medium">
                                  Lines of Code
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white block mt-0.5">
                                  {selectedNode.linesOfCode}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                                <span className="text-[9px] text-gray-500 block uppercase font-medium">
                                  Commits
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white block mt-0.5">
                                  {selectedNode.commits}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                                <span className="text-[9px] text-gray-500 block uppercase font-medium">
                                  Last Edited
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white block mt-0.5">
                                  {selectedNode.lastModified}
                                </span>
                              </div>
                            </div>

                            {/* Contributors */}
                            {selectedNode.contributors && selectedNode.contributors.length > 0 && (
                              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                                <span className="text-[9px] text-gray-500 block uppercase tracking-widest font-semibold mb-1.5">
                                  Contributors ({selectedNode.contributors.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {selectedNode.contributors.map((c: string) => (
                                    <span
                                      key={c}
                                      className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-semibold"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Imports */}
                            {selectedNode.imports && selectedNode.imports.length > 0 && (
                              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                                <span className="text-[9px] text-gray-500 block uppercase tracking-widest font-semibold mb-1.5">
                                  Module Imports ({selectedNode.imports.length})
                                </span>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                                  {selectedNode.imports.map((imp: string) => (
                                    <span
                                      key={imp}
                                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5 font-mono text-[9px] rounded text-gray-600 dark:text-gray-300 truncate max-w-full"
                                      title={imp}
                                    >
                                      {imp}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exports */}
                            {selectedNode.exports && selectedNode.exports.length > 0 && (
                              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                                <span className="text-[9px] text-gray-500 block uppercase tracking-widest font-semibold mb-1.5">
                                  Symbol Exports ({selectedNode.exports.length})
                                </span>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                                  {selectedNode.exports.map((exp: string) => (
                                    <span
                                      key={exp}
                                      className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] rounded"
                                    >
                                      {exp}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Folder stats */}
                        {selectedNode.isFolder && (
                          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 text-xs text-gray-500">
                            📁 Folder group does not contain file-level size, line count or commit
                            telemetry metrics. Double-click or expand in the Folder Tree tab to view
                            child files.
                          </div>
                        )}
                      </div>

                      <div className="border-t border-black/5 dark:border-white/5 pt-3.5 mt-4 text-[10px] text-gray-400 text-center select-none pointer-events-none">
                        CommitPulse Visualizer Engine
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
