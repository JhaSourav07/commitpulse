// This file intentionally renders nothing.
//
// Previously this rendered <LoadingScreen /> directly, but Next.js would
// abruptly unmount it the moment API data arrived — cutting the animation short.
//
// The LoadingScreen overlay is now rendered inside DashboardPageWrapper
// (a client component wrapping the page content), which keeps it alive for
// its full 3500ms animation regardless of how fast the GitHub API responds.
export default function DashboardLoading() {
  return null;
}
