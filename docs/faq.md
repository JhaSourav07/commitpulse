# ❓ Frequently Asked Questions (FAQ) & Troubleshooting

This document addresses common questions and troubleshooting topics regarding CommitPulse, including contribution discrepancies, caching, rate limits, and configuration parameters.

---

### Why does my contribution count differ from GitHub?

GitHub calculates contribution data using UTC timestamps. CommitPulse syncs cache invalidation with UTC midnight to ensure consistent results.

For deep technical details, check the [Real-Time Accuracy & Caching Architecture](accuracy.md) guide.

### Why are my latest commits not visible immediately?

Data is cached for performance. Use `&refresh=true` to force fresh data.

### Can I use my local timezone?

Yes. Use the `tz` parameter with any valid IANA timezone.

Example:
`?tz=Asia/Kolkata`

### Can I configure the grace period?

Yes. Use the `grace` parameter to control how many days of inactivity are forgiven before your streak resets:

- `?grace=0` — strict mode, resets on any missed day
- `?grace=1` — default behavior (1 day grace)
- `?grace=2` — lenient, forgives up to 2 consecutive missed days

Valid range is 0–7. Values outside this range are clamped automatically. See the [Customization Guide](customization.md) for more details.

### Do private contributions count?

Yes — if private contributions visibility is enabled in your GitHub settings.

### Are there GitHub API rate limits?

Yes. CommitPulse minimizes API usage via caching and optimized GraphQL queries, but if you hit the GitHub API rate limit (typically 5,000 requests per hour for authenticated users), you might see errors or missing data.

#### Troubleshooting Rate Limit Errors

1. **Wait it out:** Rate limits automatically reset every hour.
2. **Provide your own PAT:** If self-hosting, ensure you've provided a valid `GITHUB_TOKEN` in `.env.local` to get the authenticated rate limit. See the [Self-Hosting Guide](self_hosting.md) for details.
3. **Avoid aggressive bypassing:** Avoid repeatedly using the `&refresh=true` parameter, which bypasses the cache and consumes API quota on every load.
4. **Check GitHub API Status:** Occasionally, GitHub's GraphQL API itself experiences degradation. Check [githubstatus.com](https://www.githubstatus.com/).
