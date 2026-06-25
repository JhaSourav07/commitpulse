// types/dependency.ts
// Repository Dependency Intelligence types

export interface Dependency {
  name: string;
  version: string;
  type: 'direct' | 'transitive';
  repository?: string;
  stars?: number;
  health?: number;
  vulnerabilities?: number;
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: 'root' | 'dependency';
  health: number;
  risk: 'low' | 'medium' | 'high';
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: 'depends-on' | 'peer';
}

export interface DependencyData {
  graph: {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
  };
  summary: DependencySummary;
  riskAnalysis: RiskAnalysis[];
}

export interface DependencySummary {
  total: number;
  direct: number;
  transitive: number;
  outdated: number;
  vulnerable: number;
  healthy: number;
}

export interface RiskAnalysis {
  id: string;
  type: 'vulnerability' | 'outdated' | 'license' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  package: string;
  description: string;
  recommendation: string;
}

export interface PackageHealth {
  name: string;
  downloads: number;
  stars: number;
  openIssues: number;
  lastPublish: string;
  maintenanceStatus: 'active' | 'maintained' | 'deprecated' | 'no-maintainer';
}
