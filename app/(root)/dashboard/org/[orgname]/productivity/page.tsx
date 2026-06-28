import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Productivity Intelligence | CommitPulse',
  description: 'Track developer productivity KPIs, trends, and contribution quality metrics',
};

export default function ProductivityIntelligencePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Developer Productivity Intelligence</h1>
        <p className="text-muted-foreground">
          Comprehensive productivity metrics, contribution quality analysis, and activity insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">PRs Merged</h3>
          <p className="text-3xl font-bold">142</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Lines of Code</h3>
          <p className="text-3xl font-bold">48.2K</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Reviews Done</h3>
          <p className="text-3xl font-bold">287</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Avg PR Size</h3>
          <p className="text-3xl font-bold">156</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Productivity Trends</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Productivity trend chart placeholder
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Contribution Quality</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Quality metrics placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
