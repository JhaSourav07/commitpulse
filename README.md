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

## 📖 Table of Contents

- [Design Philosophy](#the-isometric-monolith--design-philosophy)
- [Live Demo](#live-demo)
- [Deep Customization](#deep-customization--url-parameters)
  - [Parameter Reference](#parameter-reference)
  - [Grace Period Examples](#grace-period-examples)
  - [Theme Presets](#theme-presets)
- [Theme Preview Gallery](#theme-preview-gallery)
- [Real-Time Accuracy](#real-time-accuracy--the-contribution-count-problem)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Self-Hosting](#self-hosting-in-4-steps)
- [Automated Contributor Workflow](#automated-contributor-workflow)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Maintainers](#-maintainers)
- [Themes](#themes)
- [Contributors](#contributors)

---

![CommitPulse Live Demo](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon)

[![Join CommitPulse Discord](https://img.shields.io/badge/Join-CommitPulse%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/Cb73bS79j)

```md
![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME)
```

  </div>

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

## 🔴 Live Demo

Transform your GitHub contribution history into a cinematic 3D monolith.

### ✨ Theme Showcase

  <table align="center">
  <tr>

  <td align="center">

#### Default

  <a href="https://commitpulse.vercel.app/api/streak?user=jhasourav07">
    <img 
      src="https://commitpulse.vercel.app/api/streak?user=jhasourav07" 
      width="600"
    />
  </a>

  </td>

  <td align="center">

#### Neon

  <a href="https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon">
    <img 
      src="https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon" 
      width="600"
    />
  </a>

  </td>

  <td align="center">

#### Custom

  <a href="https://commitpulse.vercel.app/api/streak?user=jhasourav07&bg=0a0a0a&accent=ff6b35&text=ffffff">
    <img 
      src="https://commitpulse.vercel.app/api/streak?user=jhasourav07&bg=0a0a0a&accent=ff6b35&text=ffffff" 
      width="600"
    />
  </a>

  </td>

  </tr>
  </table>

---

### 📋 Copy Examples

#### 🌑 Default

```md
![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07)
```

#### 🌟 Neon

```md
![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon)
```

#### 🔥 Custom

```md
![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07&bg=0a0a0a&accent=ff6b35&text=ffffff)
```

---

## 🎨 Deep Customization — URL Parameters

CommitPulse is designed to be **fully composable**. Every visual attribute is controllable via a URL parameter, following a clear priority chain:

```
URL Parameter > Theme Default > System Fallback
```

### Parameter Reference

| Parameter           | Type      | Required   | Default                        | Description                                                                                                                                                               |
| ------------------- | --------- | ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`              | `string`  | ✅ **Yes** | —                              | GitHub username to render                                                                                                                                                 |
| `theme`             | `string`  | No         | `dark`                         | Preset theme name (see below)                                                                                                                                             |
| `bg`                | `hex`     | No         | Theme default                  | Background color — **without** `#`                                                                                                                                        |
| `accent`            | `hex`     | No         | Theme default                  | Tower & glow color — **without** `#`                                                                                                                                      |
| `text`              | `hex`     | No         | Theme default                  | Label & stat text color — **without** `#`                                                                                                                                 |
| `radius`            | `number`  | No         | `8`                            | Border corner radius in pixels                                                                                                                                            |
| `border`            | `string`  | No         | —                              | Custom stroke color around the main SVG container — **without** `#`                                                                                                       |
| `speed`             | `string`  | No         | `8s`                           | Radar scan duration (`2s`–`20s`, default `8s`)                                                                                                                            |
| `scale`             | `string`  | No         | `linear`                       | Tower height scaling: `linear` or `log` (logarithmic)                                                                                                                     |
| `size`              | `string`  | No         | `medium`                       | Badge dimensions: `small` (400×280), `medium` (600×420), `large` (800×560)                                                                                                |
| `font`              | `string`  | No         | CommitPulse default typography | Any **Google Font** name (e.g. `Orbitron`, `Inter`)                                                                                                                       |
| `refresh`           | `boolean` | No         | `false`                        | Bypass cache for real-time data                                                                                                                                           |
| `year`              | `string`  | No         | —                              | Calendar year to render (e.g. `2023`, `2024`)                                                                                                                             |
| `days`              | `number`  | No         | —                              | Number of days of contribution history to fetch and render. Accepts a positive integer up to `365` (e.g. `days=90`).                                                      |
| `from`              | `string`  | No         | —                              | Start date for the contribution query in ISO 8601 format (e.g. `2023-01-01`). Must be less than or equal to `to` date.                                                    |
| `to`                | `string`  | No         | —                              | End date for the contribution query in ISO 8601 format (e.g. `2023-12-31`). Must be greater than or equal to `from` date.                                                 |
| `hide_title`        | `boolean` | No         | `false`                        | Hide GitHub username/title from the SVG badge                                                                                                                             |
| `hide_background`   | `boolean` | No         | `false`                        | Remove the background rect, letting the monolith float on the page                                                                                                        |
| `hide_stats`        | `boolean` | No         | `false`                        | Hides the bottom row displaying Current Streak, Annual Sync Total, and Peak Streak stats when set to `true` or `1`.                                                       |
| `tz`                | `string`  | No         | Omitted = UTC                  | IANA timezone (e.g. `Asia/Kolkata`, `America/New_York`) — aligns "today" with the user local midnight. Note: `?tz=UTC` is valid but cached separately from omitting `tz`. |
| `lang`              | `string`  | No         | `en`                           | Language code for labels (`en`, `es`, `hi`, `fr`, `pt`, `ko`, `ja`, `de`, `zh`)                                                                                           |
| `view`              | `string`  | No         | `default`                      | Rendering mode: `default` (3D Monolith), `monthly` (Compact monthly stats), or `heatmap` (flat 2D contribution heatmap)                                                   |
| `entrance`          | `string`  | No         | `rise`                         | Entrance animation for towers: `rise` (default), `fade`, `slide`, or `none`.                                                                                              |
| `disable_particles` | `boolean` | No         | `false`                        | Disable floating heat particle animations on the monolith towers when set to `true` or `1`.                                                                               |
| `glow`              | `boolean` | No         | `true`                         | Enable neon-style glow/blur effects for the towers. Accepts `true`/`1` (enable) or `false`/`0` (disable).                                                                 |
| `delta_format`      | `string`  | No         | `percent`                      | Format for month-over-month delta in monthly view: `percent` (e.g. +12%), `absolute` (e.g. +15 commits), or `both`                                                        |
| `width`             | `number`  | No         | `300`                          | Custom width for the SVG canvas (currently only applies to `view=monthly`)                                                                                                |
| `height`            | `number`  | No         | `120`                          | Custom height for the SVG canvas (currently only applies to `view=monthly`)                                                                                               |
| `grace`             | `number`  | No         | `1`                            | Grace period in days before a streak resets (0–7). `grace=0` = strict mode (no missed days), `grace=2` = lenient (forgives up to 2 missed days). Default is `1`.          |
| `mode`              | `string`  | No         | `commits`                      | Rendering mode: `commits` (default) or `loc` (Lines of Code landscape)                                                                                                    |
| `repo`              | `string`  | No         | —                              | Render the monolith for a specific repository (e.g. `owner/repo`) instead of the whole profile                                                                            |
| `org`               | `string`  | No         | —                              | Organization name to generate a Mega-City for                                                                                                                             |
| `labels`            | `boolean` | No         | `false`                        | Render optional 3D isometric month headers and weekday labels                                                                                                             |
| `labelColor`        | `hex`     | No         | —                              | Custom text color for the isometric labels — **without** `#`                                                                                                              |
| `versus`            | `string`  | No         | —                              | GitHub username of an opponent to compare against in side-by-side versus mode                                                                                             |
| `shading`           | `boolean` | No         | `false`                        | Apply intensity-based opacity shading to tower faces so lower intensity levels appear slightly dimmer                                                                     |
| `opacity`           | `number`  | No         | `1.0`                          | Global opacity scalar for all tower fill-opacity values (0.1–1.0). `opacity=0.5` = semi-transparent ghost look. `opacity=0.8` = faded, great on light backgrounds.        |
| `gradient`          | `boolean` | No         | `false`                        | Opt-in to show volumetric gradients on the monolith floor                                                                                                                 |
| `gradient_stops`    | `string`  | No         | —                              | Comma-separated list of hex colors (e.g. `ff6b35,ff007f`) for custom floor gradient. Requires `gradient=true` and at least two valid colors. Hex prefix `#` is optional.  |
| `gradient_dir`      | `string`  | No         | `vertical`                     | Direction of the volumetric floor gradient: `vertical` (default), `horizontal`, or `diagonal`.                                                                            |

> All parameters below are optional except `user`. Append them to the base URL as query string key-value pairs (e.g. `?user=YOUR_USERNAME&theme=neon&size=large`). Boolean parameters accept `true` or `false`. Hex color values are provided **without** the `#` prefix.

| Parameter         | Description                                                                                     | Default            | Allowed Values / Constraints                                                    | Example                  |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------- | ------------------------ |
| `user`            | GitHub username to render (Required)                                                            | —                  | Any valid GitHub username                                                       | `?user=jhasourav07`      |
| `theme`           | Preset theme name                                                                               | `dark`             | `auto`, `dark`, `neon`, `dracula`, `github`, `light`, `gruvbox`, `random`, etc. | `?theme=dracula`         |
| `bg`              | Background color                                                                                | Theme default      | Hex color code (without `#`)                                                    | `?bg=0d1117`             |
| `accent`          | Tower & glow color                                                                              | Theme default      | Hex color code (without `#`)                                                    | `?accent=58a6ff`         |
| `text`            | Label & stat text color                                                                         | Theme default      | Hex color code (without `#`)                                                    | `?text=c9d1d9`           |
| `radius`          | Border corner radius in pixels                                                                  | `8`                | Numeric value                                                                   | `?radius=16`             |
| `border`          | Custom stroke color around the SVG container                                                    | —                  | Hex color code (without `#`)                                                    | `?border=ff0000`         |
| `speed`           | Radar scan duration                                                                             | `8s`               | `2s`–`20s`                                                                      | `?speed=4s`              |
| `scale`           | Tower height scaling                                                                            | `linear`           | `linear`, `log`                                                                 | `?scale=log`             |
| `size`            | Badge dimensions                                                                                | `medium`           | `small`, `medium`, `large`                                                      | `?size=large`            |
| `font`            | Custom font for text                                                                            | Default typography | Any valid Google Font name                                                      | `?font=Orbitron`         |
| `refresh`         | Bypass cache for real-time data                                                                 | `false`            | `true`, `false`                                                                 | `?refresh=true`          |
| `year`            | Calendar year to render                                                                         | Current year       | `2023`, `2024`, etc.                                                            | `?year=2023`             |
| `hide_title`      | Hide GitHub username/title                                                                      | `false`            | `true`, `false`                                                                 | `?hide_title=true`       |
| `hide_background` | Remove the background rect                                                                      | `false`            | `true`, `false`                                                                 | `?hide_background=true`  |
| `hide_stats`      | Hide bottom row displaying stats                                                                | `false`            | `true`, `false`                                                                 | `?hide_stats=true`       |
| `tz`              | IANA timezone                                                                                   | `UTC`              | Valid IANA timezone                                                             | `?tz=Asia/Kolkata`       |
| `lang`            | Language code for labels                                                                        | `en`               | `en`, `es`, `hi`, `fr`, `pt`, `ko`, `ja`, `de`, `zh`                            | `?lang=hi`               |
| `view`            | Rendering mode                                                                                  | `default`          | `default`, `monthly`, `heatmap`                                                 | `?view=heatmap`          |
| `entrance`        | Entrance animation for towers                                                                   | `rise`             | `rise`, `fade`, `slide`, `none`                                                 | `?entrance=fade`         |
| `delta_format`    | Month-over-month delta format (`view=monthly`)                                                  | `percent`          | `percent`, `absolute`, `both`                                                   | `?delta_format=absolute` |
| `width`           | Custom width for SVG canvas (`view=monthly`)                                                    | `300`              | Numeric value                                                                   | `?width=400`             |
| `height`          | Custom height for SVG canvas (`view=monthly`)                                                   | `120`              | Numeric value                                                                   | `?height=150`            |
| `grace`           | Grace period in days before streak resets (see [Grace Period Examples](#grace-period-examples)) | `1`                | `0`–`7`                                                                         | `?grace=2`               |
| `mode`            | Base data rendering mode                                                                        | `commits`          | `commits`, `loc`                                                                | `?mode=loc`              |
| `repo`            | Render monolith for a specific repository                                                       | —                  | `owner/repo`                                                                    | `?repo=vercel/next.js`   |
| `org`             | Organization name to generate a Mega-City for                                                   | —                  | Valid GitHub organization name                                                  | `?org=vercel`            |
| `labels`          | Render optional isometric month/weekday labels                                                  | `false`            | `true`, `false`                                                                 | `?labels=true`           |
| `labelColor`      | Custom text color for isometric labels                                                          | —                  | Hex color code (without `#`)                                                    | `?labelColor=ffffff`     |
| `versus`          | Compare against an opponent side-by-side                                                        | —                  | Any valid GitHub username                                                       | `?versus=octocat`        |
| `shading`         | Apply intensity-based opacity shading to tower faces                                            | `false`            | `true`, `false`                                                                 | `?shading=true`          |
| `opacity`         | Global opacity scalar for tower fill                                                            | `1.0`              | `0.1`–`1.0`                                                                     | `?opacity=0.8`           |
| `gradient`        | Show volumetric gradients on the floor                                                          | `false`            | `true`, `false`                                                                 | `?gradient=true`         |

### Grace Period Examples

```md
<!-- Strict mode — streak resets on any single missed day -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME&grace=0)

<!-- Default — one day grace period (current behavior) -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME&grace=1)

<!-- Lenient — forgives up to 2 consecutive missed days -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME&grace=2)
```

### Theme Presets

| Theme              | Preview                     | `bg`     | `accent` | `text`   |
| ------------------ | --------------------------- | -------- | -------- | -------- |
| `auto`             | System light / dark         | _adapts_ | _adapts_ | _adapts_ |
| `dark` _(default)_ | GitHub dark                 | `0d1117` | `58a6ff` | `c9d1d9` |
| `neon`             | Cyberpunk                   | `000000` | `ff00ff` | `00ffcc` |
| `dracula`          | Dracula Pro                 | `282a36` | `bd93f9` | `f8f8f2` |
| `github`           | GitHub green                | `0d1117` | `39d353` | `ffffff` |
| `light`            | Clean & minimal             | `ffffff` | `0969da` | `24292f` |
| `gruvbox`          | Retro warm dark             | `282828` | `fe8019` | `ebdbb2` |
| `random`           | Surprise theme on reload    | _varies_ | _varies_ | _varies_ |
| `highcontrast`     | Accessibility high contrast | `0a0a0a` | `ff4500` | `ffffff` |
| `cyber-pulse`      | AMOLED true-black & cyan    | `000000` | `00ffee` | `ffffff` |
| `obsidian`         | Deep charcoal & amber gold  | `1a1a2e` | `f59e0b` | `e2e8f0` |
| `glacier`          | Icy sky blue & cyan         | `e0f2fe` | `06b6d4` | `0369a1` |
| `lumos`            | Void black & mint gold      | `0a0a0a` | `fbbf24` | `a7f3d0` |

> **`auto` uses CSS `@media (prefers-color-scheme)`** inside the SVG so the badge switches between the `light` and `dark` palettes based on the viewer's OS setting — no JavaScript required. This is ideal for GitHub profile READMEs where visitors may use either mode.

## 🎨 Theme Preview Gallery

Explore some of the built-in CommitPulse themes and quickly copy the style you like.

| Theme   | Usage Example    |
| ------- | ---------------- |
| Dark    | `?theme=dark`    |
| Neon    | `?theme=neon`    |
| Dracula | `?theme=dracula` |
| Gruvbox | `?theme=gruvbox` |
| GitHub  | `?theme=github`  |

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon)

### Examples

```md
<!-- Auto theme — adapts to the viewer's light/dark system preference -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=auto)

<!-- The Dracula aesthetic -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=dracula)

<!-- Dynamic Google Fonts — Space-age look with Orbitron -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&font=Orbitron)

<!-- Fully custom — hot orange on void black -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&bg=080808&accent=ff4500&text=eeeeee&radius=16)

<!-- Force bypass cache for latest data -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&refresh=true)

<!-- Fast scan + logarithmic scaling for power users -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&speed=4s&scale=log)

<!-- View contributions for a specific past year -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&year=2023)

<!-- Compact Monthly Stats View -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&view=monthly)

<!-- Monthly View with Absolute Delta and Custom Dimensions -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&view=monthly&delta_format=absolute&width=400&height=150)

<!-- Hide GitHub username/title -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&hide_title=true)

<!-- Hide bottom statistics row -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&hide_stats=true)

<!-- Use local timezone instead of UTC -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&tz=Asia/Kolkata)

<!-- Strict streak — resets on any single missed day -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&grace=0)

<!-- Lenient streak — forgives up to 2 missed days -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&grace=2)

<!-- Render labels in Hindi -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&lang=hi)

<!-- Render labels in Simplified Chinese -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&lang=zh)

<!-- Large badge size -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&size=large)

<!-- Side-by-side versus comparison -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&versus=octocat)

<!-- Lines of Code landscape mode -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&mode=loc)

<!-- Gradient + shading for extra depth -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&gradient=true&shading=true)

<!-- Semi-transparent ghost city look -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&opacity=0.5)

<!-- Slightly faded — perfect for light background embeds -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&opacity=0.8)

<!-- GitHub-style Heatmap View -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&view=heatmap)

<!-- Heatmap with Neon theme -->

![](https://commitpulse.vercel.app/api/streak?user=jhasourav07&view=heatmap&theme=neon)
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

🏗️ Architecture Diagram

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

---

## 🚀 Self-Hosting in 4 Steps

```bash
# 1. Clone the repository
git clone https://github.com/JhaSourav07/commitpulse.git && cd commitpulse

# 2. Install dependencies
npm install

# 3. Create your environment file
cat > .env.local << 'EOF'
GITHUB_TOKEN=your_github_pat_here

# Optional — enables user tracking (see below)
# MONGODB_URI=mongodb+srv://...
EOF

# 4. Start the development server
npm run dev
```

> **📌 Token Scope:** Your GitHub Personal Access Token needs the `read:user` scope only. No write permissions required.

Then visit: `http://localhost:3000/api/streak?user=YOUR_USERNAME`

### Optional: MongoDB User Tracking

CommitPulse records the GitHub username of everyone who generates a monolith from the landing page into a MongoDB collection. This is **entirely optional for local development** — the app works perfectly without it.

If `MONGODB_URI` is not set, the `/api/track-user` endpoint will log a warning and skip the database write gracefully:

```
WARN: MONGODB_URI is not set. Bypassing user tracking for local development.
```

To enable tracking locally, add your connection string to `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/commitpulse
```

For production (Vercel), add `MONGODB_URI` to your project's **Environment Variables** settings.

---

## 🌐 Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JhaSourav07/commitpulse&env=GITHUB_PAT&envDescription=GitHub%20Personal%20Access%20Token%20with%20read%3Auser%20scope)

Set the `GITHUB_PAT` environment variable in your Vercel project settings, and you're live.

---

## 🤖 Automated Contributor Workflow

CommitPulse features a fully custom, GitHub Actions-powered **Issue Management System** designed for large open-source events like GSSoC.

We built an anti-hoarding, self-service automation layer right into the repository:

- **Structured Issue Templates:** We use specific templates for Bug Reports and Feature Requests to maintain high quality and clarity.
- **Self-Claiming:** Issue authors can grab their issues instantly by commenting `/claim` (only the author of the issue can claim it, unless it was authored by `jhasourav07`, in which case anyone can claim it).
- **Fair Play:** A strict one-active-issue-per-contributor rule prevents issue hoarding.
- **Stale Expiry:** A scheduled chron job automatically unassigns inactive contributors after 2 days.
- **Self-Service Labels:** Anyone can tag issues using `/addlabel <tag>`.
- **Semantic Duplicate Detection:** An AI-powered duplicate detector automatically scans open issues using the Google Gemini API (`gemini-embedding-001`) to generate vector embeddings. It calculates cosine similarity and flags potential duplicate issues with a comment and a `possible-duplicate` label.

This ensures maintainers aren't bottlenecks and the community moves incredibly fast.

---

## ❓ FAQ

### Why does my contribution count differ from GitHub?

GitHub calculates contribution data using UTC timestamps. CommitPulse syncs cache invalidation with UTC midnight to ensure consistent results.

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

Valid range is 0–7. Values outside this range are clamped automatically.

### Do private contributions count?

Yes — if private contributions visibility is enabled in your GitHub settings.

### Are there GitHub API rate limits?

Yes. CommitPulse minimizes API usage via caching and optimized GraphQL queries, but if you hit the GitHub API rate limit (typically 5,000 requests per hour for authenticated users), you might see errors or missing data.

#### Troubleshooting Rate Limit Errors

1. **Wait it out:** Rate limits automatically reset every hour.
2. **Provide your own PAT:** If self-hosting, ensure you've provided a valid `GITHUB_TOKEN` in `.env.local` to get the authenticated rate limit.
3. **Avoid aggressive bypassing:** Avoid repeatedly using the `&refresh=true` parameter, which bypasses the cache and consumes API quota on every load.
4. **Check GitHub API Status:** Occasionally, GitHub's GraphQL API itself experiences degradation. Check [githubstatus.com](https://www.githubstatus.com/).

---

## 🤝 Contributing

CommitPulse is an open project built for the Web3 and open-source community. Whether you want to design a new theme, refine the isometric geometry, or improve timezone edge cases — you are welcome here.

Read the full guide: **[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## 📄 License

MIT © [Sourav Jha](https://github.com/JhaSourav07)

---

## 👥 Maintainers

- **Sourav Jha** ([@jhasourav07](https://github.com/jhasourav07)) - [LinkedIn](https://linkedin.com/in/souravjhahind)
- **Aamod Kumar** ([@Aamod007](https://github.com/Aamod007)) - [LinkedIn](https://linkedin.com/in/aamod-kumar/)

For details on the project leads and roles, please see [MAINTAINER.md](MAINTAINER.md).

---

## 🎨 Themes

Browse theme previews here: [Theme Gallery](THEMES.md)

---

  <div align="center">

_Built with obsession, shipped with precision._

⭐ **If CommitPulse made your profile look elite, drop a star.** ⭐

### This project is an official participant in GSSoC 2026.

  </div>

---

## 💖 Contributors

Thanks to all contributors who have helped make CommitPulse better!

  <a href="https://github.com/JhaSourav07/commitpulse/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=JhaSourav07/commitpulse&max=300&columns=14" alt="Contributors" />
  </a>

<sub>View the [full contributor list →](https://github.com/JhaSourav07/commitpulse/graphs/contributors)</sub>
