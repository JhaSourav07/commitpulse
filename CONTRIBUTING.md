# 🤝 Contributing to CommitPulse

> **CommitPulse is built by the open-source community, for the open-source community.**
> Whether you're a first-year developer from India shipping your first PR, or a senior engineer with 10 years of SVG experience — you belong here. The only requirement is that you care about quality.

---

## 📋 Table of Contents

- [The Standard We Hold](#-the-standard-we-hold)
- [Local Setup](#-local-setup)
- [What to Contribute](#-what-to-contribute)
- [Branch & Commit Conventions](#-branch--commit-conventions)
- [Opening a Pull Request](#-opening-a-pull-request)
- [Code Style & Quality Gates](#-code-style--quality-gates)
- [Community Guidelines](#-community-guidelines)

---

## 🏆 The Standard We Hold

CommitPulse is not a generic badge generator. It is a **premium, high-fidelity data visualization tool** with a distinct aesthetic identity.

Every contribution must uphold this standard. Before you open a PR, ask yourself:

> _"Does this look like something you'd find in a Dribbble showcase or a polished SaaS product — or does it look like a placeholder?"_

**If the answer is the latter, it's not ready yet.** This is not gatekeeping — it's respect for the developers who embed CommitPulse in their public profiles.

### What "Premium Quality" Means in Practice

- ✅ SVGs must use curated, harmonious color palettes — not arbitrary hex codes
- ✅ Animations must be smooth and purposeful — not distracting or janky
- ✅ Typography must match the `Syncopate` / `Space Grotesk` design system
- ✅ New themes must feel cohesive — every `bg`, `accent`, and `text` value must work _together_
- ❌ No raw, unstyled `<rect>` or `<text>` elements without intentional styling
- ❌ No flat, MS-Paint-level color combinations
- ❌ No breaking changes to the public API without a migration path

---

## 🛠️ Local Setup

Get CommitPulse running on your machine in under 5 minutes.

### Prerequisites

- **Node.js** `v18+`
- **npm** `v9+`
- A **GitHub Personal Access Token** — [generate one here](https://github.com/settings/tokens/new) with the `read:user` scope

### Step-by-Step

```bash
# Step 1 — Clone the repository
git clone https://github.com/JhaSourav07/commitpulse.git
cd commitpulse

# Step 2 — Install dependencies
npm install

# Step 3 — Create your local environment file
# Create a file named .env.local in the project root and add your token:
echo "GITHUB_PAT=ghp_your_token_here" > .env.local

# Step 4 — Start the dev server
npm run dev
```

Open your browser and test your changes:

```
http://localhost:3000/api/streak?user=YOUR_GITHUB_USERNAME
```

> **⚠️ Important:** Never commit your `.env.local` file or expose your `GITHUB_PAT`. It is already in `.gitignore`.

---

## 🎯 What to Contribute

We welcome contributions in three focused pillars. Staying within these areas ensures every PR adds clear, compounding value.

### 🎨 Pillar 1 — New Theme Design

Themes live in `lib/svg/themes.ts`. A theme is three properties: `bg`, `text`, and `accent` — but the _feeling_ a well-crafted theme creates is worth far more than the 3 lines of code.

**What makes a great theme:**

| Property | Guidance                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `bg`     | Should be dark (for the isometric glow to land) or intentionally light with high contrast. Avoid mid-range grays. |
| `accent` | This is the tower and glow color. It defines the entire personality of the card. Use saturated, vivid hues.       |
| `text`   | Must be readable against `bg` at small sizes. Test at `11px` (the label size).                                    |

**Theme checklist before submitting:**

- [ ] Tested against all 5 label/stat text sizes in the SVG
- [ ] Looks correct in both GitHub's Dark and Light browser modes
- [ ] Has a meaningful, memorable name (e.g., `aurora`, `synthwave`, `obsidian`)
- [ ] Added to the theme table in `README.md`

### 📐 Pillar 2 — Geometric SVG Improvements

The isometric renderer lives in `lib/svg/generator.ts`. This is where the 3D tower geometry, glow filters, and animations are built.

**Ideas we actively want:**

- More sophisticated `<feGaussianBlur>` filter chains for per-tower glow depth
- A radar/sonar ring animation layered over the monolith grid
- Height scaling improvements — the current `Math.min(count * 5, 50)` linear scale could be logarithmic for high contributors
- Responsive viewBox adjustments for different aspect ratios

**Rules for SVG changes:**

- All SVG must be **pure, self-contained** — no external image dependencies
- Animations use native SVG `<animate>` — do **not** introduce JavaScript-driven animations
- Test the output SVG in [SVG Viewer](https://www.svgviewer.dev/) before submitting
- Do not increase the `width`/`height` attributes beyond `600x420` without a strong reason
- All new visual data elements **must include a descriptive `<title>` tag** — accessibility (a11y) is non-negotiable for an elite builder community

### 🕐 Pillar 3 — Timezone Logic Optimization

The accuracy engine lives in `utils/time.ts` and `lib/calculate.ts`.

**Problems worth solving:**

- User-configurable timezone offsets (e.g., `?tz=Asia/Kolkata`) so the "today" boundary reflects the user's local day, not UTC
- Edge case: contributors who span the UTC midnight window and see their streak reset prematurely
- The grace period logic in `calculate.ts` could be extended to be configurable (e.g., `?grace=2` for 2-day grace)

**Rules for logic changes:**

- All changes must be backward-compatible (no breaking the default behavior)
- Include a code comment explaining _why_ the logic works, not just _what_ it does
- If you add a new URL parameter, document it in `README.md`'s parameter table

---

## 🌿 Branch & Commit Conventions

### Branch Naming

Use the following format: `type/short-description`

| Branch Type     | Example                      |
| --------------- | ---------------------------- |
| New theme       | `feat/theme-aurora`          |
| SVG improvement | `feat/tower-glow-filter`     |
| Bug fix         | `fix/streak-grace-period`    |
| Timezone work   | `fix/utc-midnight-edge-case` |
| Documentation   | `docs/readme-update`         |
| Refactor        | `refactor/generator-cleanup` |

### Commit Messages

Write **atomic commits** — one logical change per commit. Follow the [Conventional Commits](https://www.conventionalcommits.org) standard:

```
type(scope): short description in lowercase

# Examples:
feat(themes): add aurora preset with teal-pink palette
fix(calculate): handle grace period when today has zero contributions
docs(readme): add aurora theme to parameter table
refactor(generator): extract tower path builder into helper function
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

> **One commit should do one thing.** A PR with 15 commits that all say "update" will be asked to be squashed before merging.

---

## 🔁 Opening a Pull Request

1. **Fork** the repository and create your branch off `main`
2. **Make your changes** following the pillar guidelines above
3. **Test locally** — verify the SVG renders correctly at `localhost:3000/api/streak?user=YOUR_USERNAME`
4. **Open a PR** with the following template filled out:

```md
## What does this PR do?

<!-- One sentence summary -->

## Pillar

- [ ] New Theme Design
- [ ] Geometric SVG Improvement
- [ ] Timezone Logic Optimization
- [ ] Other (describe below)

## Visual Preview

<!-- Paste a screenshot or embed the SVG output URL -->

## Checklist

- [ ] I've tested this locally
- [ ] The SVG output matches the CommitPulse aesthetic standard
- [ ] I've updated README.md if I added a new parameter or theme
- [ ] My commits follow the Conventional Commits format
```

> **PRs without a visual preview for any SVG-touching changes will be asked for one before review.**

---

## 🧹 Code Style & Quality Gates

CommitPulse uses **TypeScript** and **ESLint**. Before pushing:

```bash
# Check for linting errors
npm run lint
```

**Key style rules:**

- All functions must have **explicit TypeScript return types**
- Use the `BadgeParams`, `StreakStats`, and `BadgeTheme` interfaces from `types/index.ts` — do not use `any` unless there is no alternative
- SVG strings in `generator.ts` should remain readable — don't minify or compress them inline
- Comments should explain _intent_, not repeat the code. `// Calculate streak` is useless. `// Grace period: a streak survives a missed day to handle timezones` is valuable.

---

## 🌍 Community Guidelines

CommitPulse is a project built by a first-year developer for the **Web3 and open-source community**. That means this is a space where learning is celebrated, not hidden.

- **Ask questions freely.** Open a GitHub Discussion or comment on an Issue.
- **Teach, don't gatekeep.** If you see a mistake in someone's PR, explain why it's wrong and how to fix it.
- **Ship complete work.** Half-done PRs stall. If you start something, try to bring it to a mergeable state.
- **Credit others.** If your implementation is inspired by another project, say so in your PR description or code comment.

---

## ❓ Not Sure Where to Start?

Check the open issues tagged:

- [`good first issue`](https://github.com/JhaSourav07/commitpulse/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — Beginner-friendly
- [`theme-request`](https://github.com/JhaSourav07/commitpulse/issues?q=is%3Aissue+is%3Aopen+label%3Atheme-request) — Design contributions
- [`svg-enhancement`](https://github.com/JhaSourav07/commitpulse/issues?q=is%3Aissue+is%3Aopen+label%3Asvg-enhancement) — Geometric improvements

---

<div align="center">

_Thank you for contributing. Every PR — no matter the size — makes CommitPulse better for every developer who uses it._

**— Sourav Jha, Maintainer**

</div>
