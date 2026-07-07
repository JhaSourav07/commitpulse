import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Repository Recommendations | CommitPulse',
  description: 'Get personalized repository and issue recommendations powered by AI',
};

export default function AIRecommendationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Repository Recommendations</h1>
        <p className="text-muted-foreground">
          Personalized repository suggestions and issue recommendations based on your contribution
          history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🤖</span>
            <span className="text-sm text-muted-foreground">AI Match</span>
          </div>
          <h3 className="font-semibold mb-2">Recommended Repositories</h3>
          <p className="text-sm text-muted-foreground">
            Based on your skill set and past contributions
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📋</span>
            <span className="text-sm text-muted-foreground">Good First Issue</span>
          </div>
          <h3 className="font-semibold mb-2">Beginner Issues</h3>
          <p className="text-sm text-muted-foreground">
            Curated issues perfect for new contributors
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎯</span>
            <span className="text-sm text-muted-foreground">Trending</span>
          </div>
          <h3 className="font-semibold mb-2">Popular Projects</h3>
          <p className="text-sm text-muted-foreground">Hot repositories in your tech stack</p>
        </div>
      </div>

      <div className="p-6 rounded-lg border bg-card">
        <h2 className="text-xl font-semibold mb-4">Recommendation Feed</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border">
            <h3 className="font-medium">awesome-javascript</h3>
            <p className="text-sm text-muted-foreground">
              Curated list of JavaScript resources - 98% match
            </p>
          </div>
          <div className="p-4 rounded-lg border">
            <h3 className="font-medium">react-patterns</h3>
            <p className="text-sm text-muted-foreground">
              Common React patterns and best practices - 95% match
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
