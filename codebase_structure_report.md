# ⚡ CommitPulse Codebase Architecture & Structure Report

Welcome to the **CommitPulse** codebase! This report provides a complete structural walkthrough of the application, designed to help you understand the architecture, request flows, rendering pipelines, data models, and testing strategies implemented in this repository.

---

## 🏛️ 1. Executive Summary & Core Value Proposition

**CommitPulse** is a Next.js-based web application that fetches GitHub contribution histories and transforms them into an **Isometric 3D City Monolith** (or other views like heatmaps, constellations, languages, and pulses) rendered dynamically as animated SVGs.

These badges can be embedded directly in GitHub Profile READMEs, providing a cinematic, high-impact visualization of a developer's shipping cadence.

```
       [Client Request]
              │
              ▼
    ┌───────────────────┐
    │  Next Middleware  │ ──► [Rate-limiting using getClientIp.ts & Upstash Redis / Memory]
    └───────────────────┘
              │
              ▼
    ┌───────────────────┐
    │   app/api/streak  │ ──► [Parses & validates parameters using Zod validations.ts]
    └───────────────────┘
              │
              ▼
    ┌───────────────────┐
    │  lib/github.ts    │ ──► [Fetches contributions via GitHub GraphQL API v4]
    └───────────────────┘
              │
              ▼
    ┌───────────────────┐
    │  lib/calculate.ts │ ──► [Calculates current/longest streaks & monthly/wrapped stats]
    └───────────────────┘
              │
              ▼
    ┌───────────────────┐
    │lib/svg/generator.t│ ──► [Renders 3D Isometric SVG, appends CSS animations & filters]
    └───────────────────┘
              │
              ▼
       [SVG Response]
```

---

## 🏗️ 2. Core Technology Stack

| Layer                    | Technology                | Purpose                                                                            |
| :----------------------- | :------------------------ | :--------------------------------------------------------------------------------- |
| **Framework**            | Next.js 16 (App Router)   | Handles both the frontend application and the backend serverless API routes.       |
| **Language**             | TypeScript 5              | Structural type safety across parameters, layouts, and API payloads.               |
| **Data Fetching**        | GitHub GraphQL API v4     | Used to fetch dense contribution calendar datasets (e.g. 98-day and annual grids). |
| **Database**             | MongoDB + Mongoose        | Persists registered users, student profiles, and reviews.                          |
| **Caching / Rate Limit** | Upstash Redis / Vercel KV | Shared rate-limiting and L2 distributed caching across Edge nodes.                 |
| **Animation & Styling**  | Framer Motion, GSAP, CSS  | Powering fluid transitions on the interactive dashboards.                          |
| **SVG Rendering**        | Pure XML SVG Elements     | Utilizes `<feGaussianBlur>` glow filters and native SVG `<animate>` elements.      |
| **Testing**              | Vitest & Testing Library  | Fast, concurrent testing of SVG compilers, layouts, and database adapters.         |

---

## 📁 3. Directory Structure & Key Files Walkthrough

Here is the high-level tree structure of the codebase and the specific role of each folder:

### 📂 Root Configurations & Metadata

- [package.json](file:///d:/PROJECTS/commitpulse/package.json): Lists application dependencies, dev dependencies, and execution scripts (e.g., `npm run dev`, `npm run test`, `npm run build`, `npm run bench:svg`).
- [middleware.ts](file:///d:/PROJECTS/commitpulse/middleware.ts): Intercepts all matched API routes to enforce client rate-limiting (`60 req/min` for general requests, `5 req/min` for explicit cache-bypassing refreshes).
- [ARCHITECTURE.md](file:///d:/PROJECTS/commitpulse/ARCHITECTURE.md): An architecture overview document summarizing the flow from Client Request to SVG Response.
- [THEME_DEVELOPMENT.md](file:///d:/PROJECTS/commitpulse/THEME_DEVELOPMENT.md): Instructions for creating and registering new color palettes.

---

### 📂 `app/` — Routing & Pages (Next.js App Router)

Next.js page routing is organized inside folders representing URL paths:

- **`app/(root)/dashboard/`**:
  - `[username]/`: Core user dashboard route. Renders the interactive commit stats dashboard client ([page.tsx](file:///d:/PROJECTS/commitpulse/app/%28root%29/dashboard/%5Busername%5D/page.tsx)).
  - `[username]/wrapped/`: User-specific year-in-review page ([page.tsx](file:///d:/PROJECTS/commitpulse/app/%28root%29/dashboard/%5Busername%5D/wrapped/page.tsx)).
  - `org/[orgname]/`: Organization-aggregated dashboard route ([page.tsx](file:///d:/PROJECTS/commitpulse/app/%28root%29/dashboard/org/%5Borgname%5D/page.tsx)).
- **`app/api/`** — Serverless API endpoints:
  - `streak/route.ts` ([route.ts](file:///d:/PROJECTS/commitpulse/app/api/streak/route.ts)): Main endpoint processing parameters like `?user=`, `?theme=`, `?view=`, fetching data, calculating streaks, compiling SVG buffers, and setting caching headers.
  - `track-user/route.ts`: Endpoint documenting user registrations.
  - `notify/route.ts`: Alert notification endpoint for system announcements.
  - `student/route.ts`: Handles requests related to student profiles.
- **`app/compare/`**: Developer head-to-head comparison page ([page.tsx](file:///d:/PROJECTS/commitpulse/app/compare/page.tsx) & [CompareClient.tsx](file:///d:/PROJECTS/commitpulse/app/compare/CompareClient.tsx)).
- **`app/customize/`**: Badge customize customizer interface ([page.tsx](file:///d:/PROJECTS/commitpulse/app/customize/page.tsx)).
- **`app/generator/`**: Monolith sandbox config builder ([page.tsx](file:///d:/PROJECTS/commitpulse/app/generator/page.tsx)).

---

### 📂 `components/` — Reusable React UI Elements

This directory houses the client-side interactive elements that render on user dashboards:

- **`components/dashboard/`**:
  - [DashboardClient.tsx](file:///d:/PROJECTS/commitpulse/components/dashboard/DashboardClient.tsx): Orchestrates the grid layout, integrating charts, heatmaps, and stats.
  - [ActivityLandscape.tsx](file:///d:/PROJECTS/commitpulse/components/dashboard/ActivityLandscape.tsx): Renders the dynamic 3D commit landscape on the client.
  - [Achievements.tsx](file:///d:/PROJECTS/commitpulse/components/dashboard/Achievements.tsx): Determines and renders developer gamification badges (e.g. "Streak Master").
  - [RadarChart.tsx](file:///d:/PROJECTS/commitpulse/components/dashboard/RadarChart.tsx): Visualizes contribution profiles across week-days or repos.
  - [GrowthTrendChart.tsx](file:///d:/PROJECTS/commitpulse/components/dashboard/GrowthTrendChart.tsx): Uses Recharts to map rolling commit trends over time.
  - [PRInsights/](file:///d:/PROJECTS/commitpulse/components/dashboard/PRInsights/): Visualizes Pull Request cycle times, sizing, and metrics.
  - [ResumeUpload.tsx](file:///d:/PROJECTS/commitpulse/components/dashboard/ResumeUpload.tsx) & [ResumePreviewForm.tsx](file:///d:/PROJECTS/commitpulse/components/dashboard/ResumePreviewForm.tsx): Handles parsing developer PDF/Word resumes to auto-optimize GitHub profiles.
- **Root Components**:
  - [Leaderboard.tsx](file:///d:/PROJECTS/commitpulse/components/Leaderboard.tsx): Renders global user ranking leaderboards.
  - [AnimatedCursor.tsx](file:///d:/PROJECTS/commitpulse/components/AnimatedCursor.tsx): Premium interactive pointer cursor effect.
  - [BrandParticles.tsx](file:///d:/PROJECTS/commitpulse/components/BrandParticles.tsx): Background canvas-based particle acceleration.
  - [WallOfLove.tsx](file:///d:/PROJECTS/commitpulse/components/WallOfLove.tsx): Interactive testimonial wall with dynamic grid arrangements.

---

### 📂 `lib/` — Business Logic Core

The backend engines and helper libraries:

- [github.ts](file:///d:/PROJECTS/commitpulse/lib/github.ts): Robust client communicating with the GitHub GraphQL API. Features automated token rotation (via `GITHUB_PAT` list), token quota monitoring, exponential backoff retries, circuit breaking, and offline schema fallbacks.
- [calculate.ts](file:///d:/PROJECTS/commitpulse/lib/calculate.ts): Contains mathematical logic for:
  - `calculateStreak()`: Deduplicates commit dates, supports user grace periods, and handles timezone boundaries.
  - `calculateMonthlyStats()`: Computes month-over-month contribution volumes and percentage deltas.
  - `aggregateCalendars()`: Merges multiple calendar streams into a unified "Mega-City" calendar.
  - `calculateWrappedStats()`: Year-end stats (weekend/weekday ratios, busiest day, top month).
- [cache.ts](file:///d:/PROJECTS/commitpulse/lib/cache.ts): Multi-tier caching wrapper. Implements an in-memory L1 cache (`TTLCache`) and distributed Upstash Redis L2 cache. Coordinates cache requests using Redis locks (mutexes) to eliminate cache stampedes.
- [rate-limit.ts](file:///d:/PROJECTS/commitpulse/lib/rate-limit.ts): In-memory and KV-backed sliding window rate limiters.
- **`lib/svg/`**: The core SVG compilation engine:
  - [generator.ts](file:///d:/PROJECTS/commitpulse/lib/svg/generator.ts): Renders SVG layout strings by computing tile positioning and mapping contribution heights to path elements.
  - [layout.ts](file:///d:/PROJECTS/commitpulse/lib/svg/layout.ts): Computes exact isometric grids (row/column to x/y coordinates) and formats tower metadata.
  - [themes.ts](file:///d:/PROJECTS/commitpulse/lib/svg/themes.ts): Configures prebuilt color palettes (Catppuccin, Gruvbox, Nord, Dracula, Neon, Sunset, Tokyo Night).
  - [animations.ts](file:///d:/PROJECTS/commitpulse/lib/svg/animations.ts): Appends CSS keyframes for neon pulsing indicators, entrance fades, and glowing grid lines.
  - [sanitizer.ts](file:///d:/PROJECTS/commitpulse/lib/svg/sanitizer.ts): Safely strips inputs, parses gradient configurations, and validates HEX parameters.
- **`lib/i18n/`**: Multi-language support mapping translation keys for badges (English, Hindi, Tamil, French, German, Spanish, Chinese, Japanese, Korean, Portuguese).

---

### 📂 `models/` — MongoDB Data Definitions

Mongoose schemas mapped to the database structure:

- [User.ts](file:///d:/PROJECTS/commitpulse/models/User.ts): Stores registered GitHub usernames and tracking timestamps.
- [StudentProfile.ts](file:///d:/PROJECTS/commitpulse/models/StudentProfile.ts): Model mapping student developer data.
- [Review.ts](file:///d:/PROJECTS/commitpulse/models/Review.ts): Stores developer testimonials and scores.
- [Notification.ts](file:///d:/PROJECTS/commitpulse/models/Notification.ts): Manages system notifications for users.

---

### 📂 `utils/` — Utility Helper Modules

- [getClientIp.ts](file:///d:/PROJECTS/commitpulse/utils/getClientIp.ts): Pulls remote IPs safely considering headers like `X-Forwarded-For` and trusted proxy ranges.
- [time.ts](file:///d:/PROJECTS/commitpulse/utils/time.ts): Computes cache TTLs dynamically based on seconds remaining until local or UTC midnight.
- [trustedProxy.ts](file:///d:/PROJECTS/commitpulse/utils/trustedProxy.ts): Filters and validates upstream reverse-proxy IPs.

---

## 🎨 4. Detailed Feature Breakdown

### A. The Isometric SVG Engine (`lib/svg/generator.ts` & `layout.ts`)

Instead of flattening statistics, CommitPulse outputs a three-dimensional perspective grid:

1.  **Isometric Grid Transformation**: Coordinates are mapped using:
    $$\text{Screen}_x = (Col - Row) \times \text{HalfTileWidth}$$
    $$\text{Screen}_y = (Col + Row) \times \text{HalfTileHeight}$$
2.  **Tower Rendering**: A daily tower consists of three `<path>` definitions corresponding to the Left face, Right face, and Top face, allowing separate shading to mimic a directed light source.
3.  **Ghost City blueprinting**: Days with zero commits are rendered as thin wireframe foundations (4px height), maintaining visual density even for inactive periods.
4.  **Glowing Effects**: SVG `<filter>` layers include `<feGaussianBlur>` to output neon ambient glows behind today's commit tower.
5.  **Interactive Hover animations**: Interactivity is supported via SVG embedded styles (`cursor: pointer`, hover scale translation, and brightness filters).

### B. Caching Strategy (`lib/cache.ts` & `utils/time.ts`)

SVGs embedded in GitHub readmes face aggressive caching by GitHub's proxy (Camo).

- **Synchronized Invalidation**: CommitPulse returns a custom header:
  `Cache-Control: public, s-maxage=[seconds_until_midnight]`
  This ensures that the cached badge is invalidated immediately when the date rolls over, rather than waiting a generic 24 hours.
- **Stampede Protection (Mutexes)**: If a cache entry expires and a rush of requests arrives simultaneously, CommitPulse uses a distributed lock key in Redis (`lock:[user]`). Only the first request acquires the lock and initiates the external GitHub fetch. Consecutive requests poll the cache until the lock is released, avoiding token exhaustion and server strain.

---

## 🧪 5. Testing Infrastructure

A defining aspect of the CommitPulse codebase is its rigorous testing setup. Every single component, utility, and routing file is backed by a structured matrix of test files, focusing on separate quality assurance vectors:

1.  **`[file].test.ts` / `[file].test.tsx`**: Tests the core functionality, logic correctness, and typical usage paths.
2.  **`[file].accessibility.test.tsx`**: Verifies ARIA compliance, screen reader attributes, semantic landmarks, and keyboard navigate-ability.
3.  **`[file].empty-fallback.test.tsx`**: Assures that zero-state inputs, empty arrays, or null calendars display structured fallback templates without crashing.
4.  **`[file].error-resilience.test.tsx`**: Emulates network exceptions, corrupted values, and timeout errors to ensure graceful degradation.
5.  **`[file].massive-scaling.test.tsx`**: Stress-tests calculations and renderers with extreme inputs (e.g. 5,000+ commits in a day or years of historical data) to verify performance.
6.  **`[file].mock-integrations.test.tsx`**: Uses mock drivers to simulate API dependencies and environment values without making real network queries.
7.  **`[file].mouse-interactivity.test.tsx`**: Simulates hover actions, selections, and clicks on client-side components to verify UI updates.
8.  **`[file].responsive-breakpoints.test.tsx`**: Ensures grid layouts and SVGs adapt correctly across mobile, tablet, and desktop viewports.
9.  **`[file].theme-contrast.test.tsx`**: Verifies that custom parameters or themes meet contrast ratios for readability.
10. **`[file].timezone-boundaries.test.ts`**: Tests boundary edge cases, specifically verifying that midnight transition calculations remain accurate across all global timezones.
11. **`[file].type-compiler.test.tsx` / `[file].test-d.ts`**: Compilation assertions to guarantee type integrity.

---

## 🚀 6. Getting Started & Development Commands

To run and experiment with the codebase locally, follow these commands:

1.  **Run Development Server**:

    ```bash
    npm run dev
    ```

    Starts the Next.js server locally on `http://localhost:3000`.

2.  **Run Test Suite**:

    ```bash
    npm run test
    ```

    Executes tests concurrently using **Vitest**.

3.  **Run SVG Benchmark**:

    ```bash
    npm run bench:svg
    ```

    Runs a benchmark test to measure the average rendering time of the SVG generator across multiple themes (typically ranges under ~5ms).

4.  **Type Check Codebase**:
    ```bash
    npm run typecheck
    ```
    Runs the TypeScript compiler in no-emit mode to assert complete type safety.
