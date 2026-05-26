# Issue Proposal: `getFullDashboardData` — Three Parallel API Calls Share No Failure Isolation, and the GitHub REST API Is Paginated But Fetched Only Once

## Background

`lib/github.ts` → `getFullDashboardData()` fires three requests in parallel using `Promise.all`:

```ts
const [profileData, reposData, calendarData] = await Promise.all([
  fetchUserProfile(username, options),
  fetchUserRepos(username, options),
  fetchGitHubContributions(username, options),
]);
```

This looks clean. Under normal conditions it works correctly.
However, there are **two compounding bugs** hiding inside this pattern that will silently corrupt real-world output for any GitHub user with more than 100 public repositories.

---

## Bug 1 — `fetchUserRepos` is silently truncated at 100 repos (pagination never happens)

### The Code

```ts
// lib/github.ts  line 211
const res = await fetchWithRetry(
  `${GITHUB_REST_URL}/users/${username}/repos?per_page=100&sort=pushed`,
  ...
);
```

The GitHub REST API for listing user repositories returns **at most 100 results per page** regardless of how many the user has. Users with >100 repos will silently receive an incomplete list — no error, no warning, just truncated data.

### What This Corrupts Downstream

`reposData` feeds two downstream computations in the same function:

1. **`totalStars`** — the star count is summed only over the 100 fetched repos. A prolific user with 200 repos and 3 000 stars across their full catalogue will show a wrong (lower) star count on the dashboard.

2. **`languageColors` / `languages`** — the top-5 language percentages are calculated from the 100 fetched repos only. The "primary language" shown in AI Insights (`lib/github.ts` line 409) could be completely wrong.

3. **`developerScore`** — the score formula uses `totalStars` which is silently under-counted.

### Why It's Hard to Notice

- The GitHub API does not set any error flag on a truncated response. It returns HTTP 200 with a JSON array that just happens to stop at 100 items.
- The response **does** include a `Link` header with `rel="next"` when more pages exist, but the current `fetchUserRepos` never reads response headers at all.
- All existing tests mock `fetchUserRepos` with a small array, so tests pass even though the real path is broken.

### Reproduction

Any real GitHub user with >100 public repositories. Example: `torvalds`, `sindresorhus`, `nicolo-ribaudo`.

---

## Bug 2 — `Promise.all` provides no partial failure isolation for the dashboard API

### The Code

```ts
// lib/github.ts  lines 277–281
const [profileData, reposData, calendarData] = await Promise.all([
  fetchUserProfile(username, options),
  fetchUserRepos(username, options),
  fetchGitHubContributions(username, options),
]);
```

`Promise.all` rejects as a whole if **any single sub-promise rejects**. This means:

- If the GitHub Contributions GraphQL call fails (e.g., a temporary 503 or a GraphQL-level error), `profileData` and `reposData` are **silently discarded** even though they succeeded — the whole dashboard returns a 500 error to the user.
- If `fetchUserRepos` fails (e.g., network glitch), the user cannot see their contribution heatmap or streak even though the streak endpoint itself is entirely unrelated to repos.

The `/api/github` route catches this and returns `{ error: 'Internal Server Error' }`, giving the UI zero data to work with.

### What the Correct Behaviour Should Be

Profile data (name, avatar, bio) and streak/calendar data are **independent**. A failure to fetch repos should degrade gracefully — the dashboard could still render with a note saying "language data unavailable" rather than showing a full blank screen.

This is especially impactful because `fetchUserRepos` is the most likely call to get rate-limited (it's a REST call that counts against the secondary rate limit), while the GraphQL contributions query uses a separate quota.

---

## Proposed Fix

### Part 1 — Paginate `fetchUserRepos`

Implement a simple `fetchAllPages` helper that follows GitHub's `Link: rel="next"` header:

```ts
async function fetchAllPages<T>(firstUrl: string, options: RequestInit): Promise<T[]> {
  let url: string | null = firstUrl;
  const results: T[] = [];

  while (url) {
    const res = await fetchWithRetry(url, options);
    if (!res.ok) throw new Error(`GitHub REST API error: ${res.status}`);

    const page = (await res.json()) as T[];
    results.push(...page);

    // Follow rel="next" from the Link header
    const link = res.headers.get('link') ?? '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    url = next;
  }

  return results;
}
```

Then replace the single-page fetch in `fetchUserRepos`:

```diff
- const res = await fetchWithRetry(
-   `${GITHUB_REST_URL}/users/${username}/repos?per_page=100&sort=pushed`,
-   { headers: getHeaders(), cache: 'no-store' }
- );
- if (!res.ok) throw new Error(`GitHub REST API error: ${res.status}`);
- const repos = (await res.json()) as GitHubRepo[];
+ const repos = await fetchAllPages<GitHubRepo>(
+   `${GITHUB_REST_URL}/users/${username}/repos?per_page=100&sort=pushed`,
+   { headers: getHeaders(), cache: 'no-store' }
+ );
```

### Part 2 — Use `Promise.allSettled` for Partial Failure Isolation

```ts
const [profileResult, reposResult, calendarResult] = await Promise.allSettled([
  fetchUserProfile(username, options),
  fetchUserRepos(username, options),
  fetchGitHubContributions(username, options),
]);

// Calendar is critical — if it fails the whole dashboard cannot render
if (calendarResult.status === 'rejected') throw calendarResult.reason;
if (profileResult.status === 'rejected') throw profileResult.reason;

const profileData = profileResult.value;
const calendarData = calendarResult.value;

// Repos are non-critical — degrade gracefully
const reposData = reposResult.status === 'fulfilled' ? reposResult.value : [];
const reposUnavailable = reposResult.status === 'rejected';
```

The returned dashboard object can then include a `reposUnavailable: boolean` flag that the UI can use to conditionally render a soft warning instead of a full error.

---

## Files to Touch

- `lib/github.ts` — add `fetchAllPages`, update `fetchUserRepos`, refactor `getFullDashboardData` to use `Promise.allSettled`
- `types/index.ts` or `types/dashboard.ts` — optionally add `reposUnavailable?: boolean` to the dashboard return type
- `lib/github.test.ts` — add unit tests for pagination (mock multiple `Link` header pages) and partial-failure scenarios

## Definition of Done

- [ ] A user with >100 public repos sees their correct total star count, correct language distribution, and correct developer score.
- [ ] A transient failure in the repos API does not blank the entire dashboard — contribution calendar and streak are still shown.
- [ ] New unit tests cover: (a) multi-page pagination, (b) partial failure — repos fail, calendar succeeds.
- [ ] No regressions in existing tests.

## Labels

`bug`, `enhancement`, `good first issue`, `GSSoC 2026`
