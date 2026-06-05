## Description

This PR fixes an issue where the in-memory rate limiter was resetting on serverless cold-starts by properly implementing a fallback to Upstash Redis / Vercel KV if configured. The rate limit logic now consumes the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables to perform atomic `INCR` and `EXPIRE` operations using the Upstash REST API pipeline. If the environment variables are absent, it safely falls back to the existing in-memory `DistributedCache` for local development. Both the standalone `rateLimit` function and the `RateLimiter` class have been updated.

Fixes #2

## Pillar

- [ ] 🎨 Pillar 1 — New Theme Design
- [ ] 📐 Pillar 2 — Geometric SVG Improvement
- [ ] 🕐 Pillar 3 — Timezone Logic Optimization
- [x] 🛠️ Other (Bug fix, refactoring, docs)

## Visual Preview

_N/A (backend changes)_

## Checklist before requesting a review:

- [x] I have read the `CONTRIBUTING.md` file.
- [x] I have tested these changes locally (`localhost:3000/api/streak?user=YOUR_USERNAME`).
- [ ] I have run `npm run format` and `npm run lint` locally and resolved all errors (CI will fail otherwise).
- [ ] I have run `npm run test` and all tests pass locally.
- [ ] I have run `npm run test:coverage` and branch coverage is at or above 70%.
- [x] My commits follow the Conventional Commits format (e.g., `feat(themes): ...`, `fix(calculate): ...`).
- [ ] I have updated `README.md` if I added a new theme or URL parameter.
- [ ] I have started the repo.
- [x] I have made sure that i have only one commit to merge in this PR.
- [ ] The SVG output matches the CommitPulse "premium quality" aesthetic standard (no raw elements, smooth animations, correct fonts).
- [ ] (Recommended) I joined the CommitPulse Discord server for faster collaboration, mentorship, and PR support.
