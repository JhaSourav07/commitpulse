<div align="center">

# ⚡ CommitPulse

### _Your GitHub contributions — as a cinematic SVG monolith._

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://commitpulse.vercel.app)
[![Changelog](https://img.shields.io/badge/Changelog-View-blue?style=flat-square)](./CHANGELOG.md)
[![GSSOC 2026](https://img.shields.io/badge/GSSOC-2026-blue.svg)](https://gssoc.girlscript.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![GraphQL](https://img.shields.io/badge/GraphQL-API-E10098?style=flat-square&logo=graphql)](https://graphql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

> **Drop this into your GitHub profile README and stop being boring.**

## 📖 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [Documentation Index](#-documentation-index)
- [Self-Hosting & Deployment](#-self-hosting--deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Maintainers](#-maintainers)
- [Themes](#-themes)
- [Contributors](#-contributors)

---

![CommitPulse Live Demo](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon)

[![Join CommitPulse Discord](https://img.shields.io/badge/Join-CommitPulse%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/f84SDraEBH)

```md
![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME)
```

</div>

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

### Theme Presets

| Theme              | Preview                      | `bg`     | `accent` | `text`   |
| ------------------ | ---------------------------- | -------- | -------- | -------- |
| `auto`             | System light / dark          | _adapts_ | _adapts_ | _adapts_ |
| `dark` _(default)_ | GitHub dark                  | `0d1117` | `58a6ff` | `c9d1d9` |
| `neon`             | Cyberpunk                    | `000000` | `ff00ff` | `00ffcc` |
| `dracula`          | Dracula Pro                  | `282a36` | `bd93f9` | `f8f8f2` |
| `github`           | GitHub green                 | `0d1117` | `39d353` | `ffffff` |
| `light`            | Clean & minimal              | `ffffff` | `0969da` | `24292f` |
| `gruvbox`          | Retro warm dark              | `282828` | `fe8019` | `ebdbb2` |
| `random`           | Surprise theme on reload     | _varies_ | _varies_ | _varies_ |
| `highcontrast`     | Accessibility high contrast  | `0a0a0a` | `ff4500` | `ffffff` |
| `cyber-pulse`      | AMOLED true-black & cyan     | `000000` | `00ffee` | `ffffff` |
| `retro-terminal`   | Classic CRT terminal         | `000000` | `00ff41` | `00ff41` |
| `obsidian`         | Deep charcoal & amber gold   | `1a1a2e` | `f59e0b` | `e2e8f0` |
| `glacier`          | Icy sky blue & cyan          | `e0f2fe` | `06b6d4` | `0369a1` |
| `lumos`            | Void black & mint gold       | `0a0a0a` | `fbbf24` | `a7f3d0` |
| `tokyo_night`      | Deep navy & soft pastel blue | `1a1b26` | `7aa2f7` | `c0caf5` |
| `monokai`          | Classic vibrant dark         | `272822` | `a6e22e` | `f8f8f2` |
| `midnight_ocean`   | Deep navy bioluminescent     | `020c1b` | `0af5ff` | `ccd6f6` |
| `india`            | Saffron & India green        | `0a0a0a` | `FF9933` | `ffffff` |
| `ocean`            | Deep sea teal & navy         | `0a192f` | `64ffda` | `ccd6f6` |
| `sunset`           | Warm dusk orange             | `1a0a0a` | `ff6b35` | `ffd6c0` |
| `forest`           | Emerald woodland green       | `0d1f0d` | `39d353` | `c8f0c8` |
| `rose`             | Blush pink romance           | `1f0d14` | `ff6b9d` | `f0c8d4` |
| `nord`             | Arctic frost blue            | `2e3440` | `88c0d0` | `d8dee9` |
| `synthwave`        | 80s retro pink glow          | `0d0221` | `ff2d78` | `f8f8f2` |
| `aurora_cyberpunk` | Aurora violet neon           | `090B13` | `9D5CFF` | `EAF2FF` |
| `catppuccin_latte` | Pastel latte light           | `eff1f5` | `1e66f5` | `4c4f69` |
| `solarized_light`  | Warm solarized light         | `fdf6e3` | `268bd2` | `586e75` |
| `gruvbox_light`    | Retro warm light             | `fbf1c7` | `d65d0e` | `3c3836` |
| `nord_light`       | Arctic frost light           | `eceff4` | `5e81ac` | `2e3440` |
| `cyberpunk`        | Neon yellow cyberpunk        | `fce22a` | `ff003c` | `111111` |
| `cyberpunk_neon`   | Electric cyan neon           | `0d0d14` | `ff0055` | `00f3ff` |
| `enterprise`       | Professional indigo dark     | `1a1a2e` | `6366f1` | `e2e8f0` |

> **`auto` uses CSS `@media (prefers-color-scheme)`** inside the SVG so the badge switches between the `light` and `dark` palettes based on the viewer's OS setting — no JavaScript required. This is ideal for GitHub profile READMEs where visitors may use either mode.

For all URL parameters and configuration possibilities (including grace periods, custom fonts, timezone overrides, versus comparison mode, heatmap view, LOC mode, and layout dimensions), check out the **[🎨 Customization Guide & Parameters](docs/customization.md)**.

For advanced usage examples including custom gradient backgrounds, multi-user comparisons, organization dashboards, and custom date ranges, see the **[🚀 Advanced Usage Examples](docs/customization.md#-advanced-usage-examples)** section in the customization guide.

---

## ✨ Features

CommitPulse transforms GitHub contribution data into visually engaging and highly customizable SVG badges.

- **🎨 Theme & Customization**: Multiple built-in themes, custom colors (`bg`, `accent`, `text`), dynamic font selection, adjustable dimensions, border radius, opacity, and system-aware `auto` light/dark theme.
- **🎵 Spotify "Currently Playing"**: Showcase your current Spotify playback on your GitHub profile with a customizable, near real-time SVG card.
- **📈 Contribution Analytics**: Current streak and longest streak tracking, monthly contribution summaries, historical year-by-year viewing, and custom grace period configurations.
- **🔥 Visualization Modes**: Isometric 3D monolith rendering (with ghost city blueprint foundations), GitHub-style heatmap, monthly statistics view, and radar chart view.
- **🌍 Localization & Accessibility**: Multi-language support (e.g. English, Hindi, Simplified Chinese, Portuguese), timezone-aware calculations, and high-contrast accessibility themes.
- **⚔️ Comparison Features**: Side-by-side user-versus-user comparisons using the `versus` query parameter.
- **⚡ Performance & Reliability**: Real-time GitHub GraphQL integration, UTC-midnight synchronized CDN caching, and ultra-fast edge deployment.

---

## 📚 Documentation Index

To keep the repository clean and readable, technical details have been modularized:

- **[🎨 Customization Guide & Parameters](docs/customization.md)**: Explore the list of over 30 URL parameters including `theme`, `view` (e.g. `skyline`, `heatmap`, `radar`, `monthly`), `radius`, `grace`, `tz`, `entrance`, `versus`, and layout dimensions to style your monolith.
- **[🏛️ Architecture & Design Philosophy](docs/architecture.md)**: Read about why we built isometric 3D monolith landscapes instead of flat meters, and check out our Next.js 16 Edge computing pipeline.
- **[🚀 Self-Hosting & Deployment](docs/self_hosting.md)**: Step-by-step instructions to clone, configure `.env.local` with GitHub Personal Access Tokens (PAT), set up MongoDB tracking, and deploy to Vercel with one click.
- **[🎵 Spotify Setup Guide](docs/SPOTIFY_SETUP.md)**: Instructions for setting up Spotify integration for the Currently Playing feature.
- **[🤖 Automated Contributor Workflow](docs/contributor_workflow.md)**: Overview of GSSoC contribution automation, self-claiming comments `/claim`, anti-hoarding rules, stale unassign scripts, and Gemini AI-powered semantic issue duplication check.
- **[🎯 Real-Time Accuracy & Caching](docs/accuracy.md)**: Deep dive into the "off-by-N contributions" problem and how CommitPulse solves it with UTC midnight CDN expiration and no-store GraphQL fetches.
- **[❓ FAQ & Troubleshooting](docs/faq.md)**: Answers to common questions regarding timezone overrides, private contribution visibility, GitHub API rate limits, and troubleshooting.

---

## 🚀 Self-Hosting & Deployment

Get your own instance of CommitPulse running locally in 4 simple steps:

````bash
# 1. Clone the repository
git clone https://github.com/JhaSourav07/commitpulse.git && cd commitpulse

# 2. Install dependencies
npm install

# 3. Create your environment file

Create a `.env.local` file in the project root:

```env
GITHUB_TOKEN=your_github_pat_here
````

> Replace `your_github_pat_here` with your own GitHub Personal Access Token.

> ⚠️ **Security Notice**
>
> - Never commit `.env.local` or any file containing secrets to Git.
> - Keep your Personal Access Token private.
> - If your token is ever exposed, revoke it immediately from your GitHub account and generate a new one.
> - `.env.local` is intended for local development only and should remain untracked by Git.

# 4. Start the development server

```bash
npm run dev
```

> **📌 Token Scope**: > Your GitHub Personal Access Token only requires the `read:user` scope.
> Avoid granting additional permissions unless absolutely necessary, following the principle of least privilege.

Then visit: `http://localhost:3000/api/streak?user=YOUR_USERNAME`

### 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JhaSourav07/commitpulse&env=GITHUB_PAT&envDescription=GitHub%20Personal%20Access%20Token%20with%20read%3Auser%20scope)

For advanced self-hosting configurations (such as setting up the optional MongoDB user tracking), refer to the **[🚀 Self-Hosting & Deployment Guide](docs/self_hosting.md)**.

---

## 🤝 Contributing

CommitPulse is an open project built for the Web3 and open-source community. Whether you want to design a new theme, refine the isometric geometry, or improve timezone edge cases — you are welcome here.

Read the full contributor guide: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 👥 Maintainers

- **Sourav Jha** ([@jhasourav07](https://github.com/jhasourav07)) - [LinkedIn](https://linkedin.com/in/souravjhahind)
- **Aamod Kumar** ([@Aamod-Dev](https://github.com/Aamod-Dev)) - [LinkedIn](https://linkedin.com/in/aamod-kumar/)

For details on the project leads and roles, please see [MAINTAINER.md](MAINTAINER.md).

---

## 🎨 Themes

Browse all theme previews here: [Theme Gallery](THEMES.md).

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
  <img src="https://contrib.rocks/image?repo=JhaSourav07/commitpulse&max=800&columns=20" alt="Contributors" />
</a>

<sub>View the [full contributor list →](https://github.com/JhaSourav07/commitpulse/graphs/contributors)</sub>
