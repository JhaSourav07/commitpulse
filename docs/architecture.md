# 🏛️ Architecture & Design Philosophy

This document details the architectural decisions, tech stack, and design philosophy behind CommitPulse.

---

## 🏛️ The Isometric Monolith — Design Philosophy

Most GitHub stat badges are **flat**. Flat bars, flat text, flat colors. They blend into every README on the planet.

**CommitPulse is different.**

We render your contribution data as a **3D Isometric City** — a grid of glowing towers where each column's height is directly proportional to your commit count that day. The more you grind, the taller your skyline grows.

**Ghost City Architecture:** In this mode, zero-contribution days aren't just empty space. They are rendered as thin, wireframe-style **blueprint foundations** (4px high). This gives your commit landscape a structured, architectural "work-in-progress" look even during rest days, maintaining the premium 3D aesthetic across the entire calendar.

This is not decoration. This is a **live, animated data visualization** that makes your dedication impossible to ignore.

### Why Isometric > Flat

| Property         | Flat Badges       | CommitPulse Monolith                                                       |
| ---------------- | ----------------- | -------------------------------------------------------------------------- |
| **Visual Depth** | None              | Full isometric 3D perspective                                              |
| **Data Density** | 3 numbers         | 98-day contribution landscape                                              |
| **Animation**    | Static            | Radar scan line, glow effects & live pulsing indicator for today's commits |
| **Personality**  | Generic           | Uniquely yours, every day                                                  |
| **Impression**   | "They have stats" | "They ship code like a machine"                                            |

The design philosophy is simple: **your commit history deserves a monument, not a meter.**

---

## 🏗️ Architecture & Tech Stack

```
app/api/streak/route.ts       →  Next.js 16 Edge-compatible API Route
app/api/track-user/route.ts   →  User tracking API — records GitHub usernames to MongoDB
lib/github.ts                 →  GitHub GraphQL API client
lib/calculate.ts              →  Streak algorithm (current + longest + grace period)
lib/mongodb.ts                →  Cached MongoDB connection utility (serverless-safe)
lib/svg/generator.ts          →  3D Isometric SVG renderer + CSS animations
lib/svg/themes.ts             →  Prebuilt theme palette system
models/User.ts                →  Mongoose User schema
utils/time.ts                 →  UTC midnight synchronization utilities
types/index.ts                →  TypeScript interfaces (StreakStats, BadgeParams, BadgeTheme)
```

| Layer           | Technology                               | Purpose                                                            |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| **Framework**   | Next.js 16 (App Router)                  | API routes, edge deployment                                        |
| **Language**    | TypeScript 5                             | Type-safe parameters and interfaces                                |
| **Data Source** | GitHub GraphQL API v4                    | `contributionsCollection` query                                    |
| **Database**    | MongoDB + Mongoose                       | Tracks GitHub usernames of users who generate a monolith           |
| **Rendering**   | Pure SVG + SVG Filters                   | `<feGaussianBlur>` for the glow effect                             |
| **Animation**   | SVG `<animate>`                          | Radar scan line + current-day block pulsing, no external libraries |
| **Typography**  | Google Fonts (Syncopate + Space Grotesk) | Loaded inline via `@import`                                        |
| **Deployment**  | Vercel Edge Network                      | Auto-scaling, global CDN                                           |
| **Caching**     | `Cache-Control: s-maxage`                | UTC-midnight-synced cache invalidation                             |

---

## 🏗️ Architecture Diagram

```
GitHub GraphQL API
↓
Contribution Processing
↓
Streak Calculation Engine
↓
SVG Geometry Renderer
↓
Animation Layer
↓
Edge Cache/CDN
↓
Generated SVG Badge
```
