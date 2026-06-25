import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering Velocity Intelligence | CommitPulse',
  description: 'Track engineering velocity, sprint analytics, and productivity insights',
};

export default function VelocityIntelligencePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Engineering Velocity Intelligence</h1>
        <p className="text-muted-foreground">
          Comprehensive velocity metrics, sprint analytics, and productivity insights for
          engineering teams
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Velocity Score</h3>
          <p className="text-3xl font-bold">87%</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Sprint Completion</h3>
          <p className="text-3xl font-bold">94%</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Avg Cycle Time</h3>
          <p className="text-3xl font-bold">3.2d</p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-sm text-muted-foreground mb-1">Team Productivity</h3>
          <p className="text-3xl font-bold">92%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Velocity Trends</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Velocity trend chart placeholder
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-xl font-semibold mb-4">Sprint Burndown</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Sprint burndown chart placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
