# Changelog

All notable changes to CommitPulse will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project does not currently use semantic versioning. Historical milestones are
recorded under named sections that reflect the project's public development phases.

---

## [Unreleased]

### Added

- `?theme=midnight_ocean` preset — deep navy bioluminescent theme (bg: `020c1b`, accent: `0af5ff`, text: `ccd6f6`, negative: `ff4d6d`); includes WCAG contrast test in `lib/svg/themes/midnight_ocean.test.ts`
- `?year=` URL parameter to render contribution monoliths for past calendar years (PR #94)
- `?font=` URL parameter to load any Google Font family dynamically into the SVG (PR #96, Issue #81)
- `?theme=auto` preset that switches between light and dark palettes using CSS `@media (prefers-color-scheme)` — no JavaScript required (PR #102, Issue #75)
- Ghost City mode: zero-contribution days are rendered as thin wireframe-style blueprint foundations (4 px high) instead of empty space, preserving the 3D aesthetic during rest periods
- `?theme=random` preset that selects a surprise theme on each uncached request
- `?grace=` URL parameter (range 0–7) to configure the number of inactive days before a streak resets; values outside the valid range are clamped automatically
- MongoDB user-tracking endpoint (`/api/track-user`) that records GitHub usernames of visitors who generate a monolith from the landing page; gracefully skips the write when `MONGODB_URI` is not set
- `.env.local.example` file to simplify local environment setup for new contributors
- `SECURITY.md` documenting the project's security policy and responsible disclosure process
- `THEMES.md` gallery with live preview images for all 20 available theme presets
- Expanded theme library to 20 presets, including: `ocean`, `sunset`, `forest`, `rose`, `nord`, `synthwave`, `gruvbox`, `aurora_cyberpunk`, `highcontrast`, `catppuccin_latte`, `solarized_light`, `gruvbox_light`, `nord_light`, `obsidian`, `cyber-pulse`
- GitHub Actions-powered automated issue management system: self-claiming via `/claim`, one-active-issue-per-contributor rule, stale-expiry chron job, self-service `/addlabel` command, and AI-powered semantic duplicate detection using Google Gemini embeddings
- `CODE_OF_CONDUCT.md` establishing community participation standards
- `CONTRIBUTING.md` with full local setup guide, three contribution pillars, branch/commit conventions, and CI quality gates
- Discord community server for contributor coordination and PR feedback

### Changed

- Environment variable renamed from `GITHUB_PAT` to `GITHUB_TOKEN` for consistency with GitHub's standard naming convention; all documentation and setup instructions updated accordingly
- Architecture expanded from pure API to full Next.js App Router application with a landing page, components directory, and MongoDB integration layer (`lib/mongodb.ts`, `models/User.ts`)

---

## [Initial Release — Core API]

> This section documents the foundational features present at the project's public launch.
> Exact release dates are not recorded; entries are derived from the README, source architecture,
> and repository structure as of the initial commit set.

### Added

- Next.js 16 App Router API route (`app/api/streak/route.ts`) that returns a fully self-contained SVG badge
- GitHub GraphQL API v4 client (`lib/github.ts`) using the `contributionsCollection` query with `cache: 'no-store'` to bypass Next.js internal fetch caching
- Streak calculation engine (`lib/calculate.ts`) computing current streak, longest streak, and grace-period logic
- 3D isometric SVG renderer (`lib/svg/generator.ts`) producing a grid of towers whose height is proportional to daily contribution count
- CSS animation layer using native SVG `<animate>` elements: radar scan line and current-day block pulsing — no external animation libraries
- `<feGaussianBlur>`-based SVG glow filter applied to tower geometry
- UTC midnight cache synchronisation (`utils/time.ts`): CDN `Cache-Control: s-maxage` TTL is anchored to the exact next UTC midnight, ensuring cache expiry is synchronised with GitHub's contribution window boundaries
- TypeScript interfaces (`types/index.ts`): `StreakStats`, `BadgeParams`, `BadgeTheme`
- Five built-in theme presets: `dark` (default), `light`, `neon`, `github`, `dracula`
- URL parameter system: `user` (required), `theme`, `bg`, `accent`, `text`, `radius`, `speed`, `scale`, `refresh`
- `scale` parameter supporting `linear` (default) and `log` (logarithmic) tower height modes
- `refresh=true` parameter to bypass CDN cache for real-time data
- Vercel one-click deploy button with `GITHUB_TOKEN` environment variable prompt
- Prettier configuration (`.prettierrc`) and ESLint configuration (`eslint.config.mjs`)
- Vitest configuration (`vitest.config.ts`) for unit and integration testing
- MIT licence

---

[Unreleased]: https://github.com/JhaSourav07/commitpulse/compare/HEAD...HEAD
