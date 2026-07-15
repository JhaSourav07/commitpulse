import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Executive Open Source Intelligence | CommitPulse',
  description:
    'Executive-level open source metrics, engineering scorecards, and strategic insights',
};

export default function ExecutiveIntelligencePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Executive Open Source Intelligence</h1>
        <p className="text-muted-foreground">
          Strategic insights and executive-level metrics for open source program management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Total Repos</h3>
          <p className="text-3xl font-bold">1,247</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Contributors</h3>
          <p className="text-3xl font-bold">8.5K</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Stars Earned</h3>
          <p className="text-3xl font-bold">2.3M</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Engineering Score</h3>
          <p className="text-3xl font-bold text-green-500">94%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Organization KPIs</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Code Quality</span>
              <span className="font-semibold text-green-500">96%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Community Health</span>
              <span className="font-semibold text-green-500">89%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Developer Experience</span>
              <span className="font-semibold text-green-500">92%</span>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
          <div className="text-muted-foreground">
            <p>
              Your organization is performing well across key open source metrics. Continue focusing
              on community engagement and code quality to maintain momentum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
