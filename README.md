<div align="center">

# ⚡ CommitPulse

### _Your GitHub contributions — as a cinematic SVG monolith._

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://commitpulse.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![GraphQL](https://img.shields.io/badge/GraphQL-API-E10098?style=flat-square&logo=graphql)](https://graphql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

> **Drop this into your GitHub profile README and stop being boring.**

![CommitPulse Live Demo](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon)

```md
![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME)
```

</div>

---

## 🏛️ The Isometric Monolith — Design Philosophy

Most GitHub stat badges are **flat**. Flat bars, flat text, flat colors. They blend into every README on the planet.

**CommitPulse is different.**

We render your contribution data as a **3D Isometric City** — a grid of glowing towers where each column's height is directly proportional to your commit count that day. The more you grind, the taller your skyline grows. This is not decoration. This is a **live, animated data visualization** that makes your dedication impossible to ignore.

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

## 🔴 Live Demo

Paste into any Markdown file — GitHub README, Notion, or your portfolio:

```md
<!-- Default (Dark theme) -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07)

<!-- Neon theme -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon)

<!-- Custom colors -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07&bg=0a0a0a&accent=ff6b35&text=ffffff)
```

---

## 🎨 Deep Customization — URL Parameters

CommitPulse is designed to be **fully composable**. Every visual attribute is controllable via a URL parameter, following a clear priority chain:

```
URL Parameter > Theme Default > System Fallback
```

### Parameter Reference

| Parameter | Type      | Required   | Default       | Description                                           |
| --------- | --------- | ---------- | ------------- | ----------------------------------------------------- |
| `user`    | `string`  | ✅ **Yes** | —             | GitHub username to render                             |
| `theme`   | `string`  | No         | `dark`        | Preset theme name (see below)                         |
| `bg`      | `hex`     | No         | Theme default | Background color — **without** `#`                    |
| `accent`  | `hex`     | No         | Theme default | Tower & glow color — **without** `#`                  |
| `text`    | `hex`     | No         | Theme default | Label & stat text color — **without** `#`             |
| `radius`  | `number`  | No         | `8`           | Border corner radius in pixels                        |
| `speed`   | `string`  | No         | `8s`          | Radar scan animation duration (e.g. `4s`, `12s`)      |
| `scale`   | `string`  | No         | `linear`      | Tower height scaling: `linear` or `log` (logarithmic) |
| `refresh` | `boolean` | No         | `false`       | Bypass cache for real-time data                       |

### Theme Presets

| Theme              | Preview         | `bg`     | `accent` | `text`   |
| ------------------ | --------------- | -------- | -------- | -------- |
| `dark` _(default)_ | GitHub dark     | `0d1117` | `58a6ff` | `c9d1d9` |
| `neon`             | Cyberpunk       | `000000` | `ff00ff` | `00ffcc` |
| `dracula`          | Dracula Pro     | `282a36` | `bd93f9` | `f8f8f2` |
| `github`           | GitHub green    | `0d1117` | `238636` | `ffffff` |
| `light`            | Clean & minimal | `ffffff` | `0969da` | `24292f` |

### Examples

```md
<!-- The Dracula aesthetic -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=dracula)

<!-- Fully custom — hot orange on void black -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&bg=080808&accent=ff4500&text=eeeeee&radius=16)

<!-- Force bypass cache for latest data -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&refresh=true)

<!-- Fast scan + logarithmic scaling for power users -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&speed=4s&scale=log)
```

---

## 🎯 Real-Time Accuracy — The Contribution Count Problem

GitHub's contribution graph can return **different totals** depending on _when_ and _how_ you query it. We solved this at the infrastructure level.

### The Problem: Off-by-N Contributions

The GitHub GraphQL API calculates `totalContributions` and daily contribution windows using **UTC-based ISO 8601 timestamps**. A naive implementation that queries at any arbitrary time — without anchoring to UTC midnight boundaries — will produce counts that are _inconsistent_ between requests. This is the root cause of the classic "my card shows 378 but GitHub shows 385" discrepancy.

### The Solution: UTC Midnight Synchronization

CommitPulse uses a two-part fix:

**1. Cache invalidation anchored to UTC midnight (`utils/time.ts`)**

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

**2. No internal fetch caching (`lib/github.ts`)**

```typescript
const res = await fetch(GITHUB_API_URL, {
  cache: 'no-store', // Bypass Next.js's internal fetch cache
});
```

Caching is handled entirely at the HTTP response layer (`Cache-Control: s-maxage`), giving us surgical control over what gets cached and for how long — without stale data poisoning the GraphQL response.

**Result:** CommitPulse's contribution counts are always in sync with GitHub's actual UTC day boundaries.

---

## 🏗️ Architecture & Tech Stack

```
app/api/streak/route.ts     →  Next.js 16 Edge-compatible API Route
lib/github.ts               →  GitHub GraphQL API client
lib/calculate.ts            →  Streak algorithm (current + longest + grace period)
lib/svg/generator.ts        →  3D Isometric SVG renderer + CSS animations
lib/svg/themes.ts           →  Prebuilt theme palette system
utils/time.ts               →  UTC midnight synchronization utilities
types/index.ts              →  TypeScript interfaces (StreakStats, BadgeParams, BadgeTheme)
```

| Layer           | Technology                               | Purpose                                                            |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| **Framework**   | Next.js 16 (App Router)                  | API routes, edge deployment                                        |
| **Language**    | TypeScript 5                             | Type-safe parameters and interfaces                                |
| **Data Source** | GitHub GraphQL API v4                    | `contributionsCollection` query                                    |
| **Rendering**   | Pure SVG + SVG Filters                   | `<feGaussianBlur>` for the glow effect                             |
| **Animation**   | SVG `<animate>`                          | Radar scan line + current-day block pulsing, no external libraries |
| **Typography**  | Google Fonts (Syncopate + Space Grotesk) | Loaded inline via `@import`                                        |
| **Deployment**  | Vercel Edge Network                      | Auto-scaling, global CDN                                           |
| **Caching**     | `Cache-Control: s-maxage`                | UTC-midnight-synced cache invalidation                             |

---

## 🚀 Self-Hosting in 4 Steps

```bash
# 1. Clone the repository
git clone https://github.com/JhaSourav07/commitpulse.git && cd commitpulse

# 2. Install dependencies
npm install

# 3. Create your environment file
echo "GITHUB_PAT=your_token_here" > .env.local

# 4. Start the development server
npm run dev
```

> **📌 Token Scope:** Your GitHub Personal Access Token needs the `read:user` scope only. No write permissions required.

Then visit: `http://localhost:3000/api/streak?user=YOUR_USERNAME`

---

## 🌐 Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JhaSourav07/commitpulse&env=GITHUB_PAT&envDescription=GitHub%20Personal%20Access%20Token%20with%20read%3Auser%20scope)

Set the `GITHUB_PAT` environment variable in your Vercel project settings, and you're live.

---

## 🤝 Contributing

CommitPulse is an open project built for the Web3 and open-source community. Whether you want to design a new theme, refine the isometric geometry, or improve timezone edge cases — you are welcome here.

Read the full guide: **[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## 📄 License

MIT © [Sourav Jha](https://github.com/JhaSourav07)

---

## 🎨 Themes

Browse theme previews here: [Theme Gallery](THEMES.md)

---

<div align="center">

_Built with obsession, shipped with precision._

⭐ **If CommitPulse made your profile look elite, drop a star.** ⭐

### This project is an official participant in Nexus Spring of Code (NSoC) 2026.

</div>
