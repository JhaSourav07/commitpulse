# 🎯 Real-Time Accuracy & Caching Architecture

GitHub's contribution graph can return **different totals** depending on _when_ and _how_ you query it. We solved this at the infrastructure level.

---

## ⚠️ The Problem: Off-by-N Contributions

The GitHub GraphQL API calculates `totalContributions` and daily contribution windows using **UTC-based ISO 8601 timestamps**. A naive implementation that queries at any arbitrary time — without anchoring to UTC midnight boundaries — will produce counts that are _inconsistent_ between requests. This is the root cause of the classic "my card shows 378 but GitHub shows 385" discrepancy.

---

## 🛠️ The Solution: UTC Midnight Synchronization

CommitPulse uses a two-part fix:

### 1. Cache Invalidation Anchored to UTC Midnight (`utils/time.ts`)

```typescript
export function getSecondsUntilUTCMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}
```

The CDN cache TTL is set to expire at **exactly the next UTC midnight**, not at some fixed-interval offset. This guarantees that when GitHub's contribution window rolls over, our cache does too — simultaneously.

### 2. No Internal Fetch Caching (`lib/github.ts`)

```typescript
const res = await fetch(GITHUB_API_URL, {
  cache: 'no-store', // Bypass Next.js's internal fetch cache
});
```

Caching is handled entirely at the HTTP response layer (`Cache-Control: s-maxage`), giving us surgical control over what gets cached and for how long — without stale data poisoning the GraphQL response.

**Result:** CommitPulse's contribution counts are always in sync with GitHub's actual UTC day boundaries.
