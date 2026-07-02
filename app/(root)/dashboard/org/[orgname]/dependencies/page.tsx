import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repository Dependency Intelligence | CommitPulse',
  description: 'Visualize dependency graphs, track package health, and analyze risks',
};

export default function DependencyIntelligencePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Repository Dependency Intelligence</h1>
        <p className="text-muted-foreground">
          Monitor dependency health, visualize dependency graphs, and analyze security risks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Total Dependencies</h3>
          <p className="text-3xl font-bold">247</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Outdated</h3>
          <p className="text-3xl font-bold text-yellow-500">23</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Vulnerabilities</h3>
          <p className="text-3xl font-bold text-red-500">3</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Health Score</h3>
          <p className="text-3xl font-bold text-green-500">92%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Dependency Graph</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Dependency visualization placeholder
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Security Risks</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Risk analysis placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
