# 🤝 Contributing to CommitPulse

> **CommitPulse is built by the open-source community, for the open-source community.**
> Whether you're a first-year developer from India shipping your first PR, or a senior engineer with 10 years of SVG experience — you belong here. The only requirement is that you care about quality.

---

## 📋 Table of Contents

- [The Standard We Hold](#-the-standard-we-hold)
- [Local Setup](#-local-setup)
- [Testing & Previewing Your Changes](#-testing--previewing-your-changes)
- [What to Contribute](#-what-to-contribute)
- [Automated Issue Management & Claiming](#-automated-issue-management--claiming)
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

# Step 3 — Set up your environment variables from the provided template
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values. Every variable is documented inside the file. The key ones are:

> **Why is `GITHUB_TOKEN` required?** The GitHub GraphQL API requires authentication. Without a valid `GITHUB_TOKEN`, every request to `/api/streak` will return a `401 Unauthorized` error and the badge will not render.

> **Why is `MONGODB_URI` optional?** The `/api/track-user` route is designed to degrade gracefully. If the variable is missing, it logs a warning to the console and skips the DB write — your local dev experience is completely unaffected.

**Generating a Personal Access Token (classic):**
Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)** and click **Generate new token (classic)**. Enable the `read:user` scope, set an expiry, and copy the generated token into your `.env.local`.

```bash
# Step 4 — Start the dev server
npm run dev
```

Open your browser and test your changes:

```
http://localhost:3000/api/streak?user=YOUR_GITHUB_USERNAME
```

> **⚠️ Important:** Never commit your `.env.local` file or expose your `GITHUB_TOKEN`. It is already in `.gitignore`.

---

## 🧪 Testing & Previewing Your Changes

Before opening a PR, every contributor is expected to verify their changes locally across three areas: **visual SVG output**, **unit tests**, and **branch coverage**. This section explains how to do all three.

### 1. Visual Browser Preview

With your dev server running (`npm run dev`), open your browser and visit these URLs to preview the SVG output directly — **open them as raw URLs, not embedded in an `<img>` tag or Markdown preview**:

**Standard badge — valid username:**

```
http://localhost:3000/api/streak?user=YOUR_GITHUB_USERNAME
```

**Monthly view:**

```
http://localhost:3000/api/streak?user=YOUR_GITHUB_USERNAME&view=monthly
```

**Custom theme — test your color changes:**

```
http://localhost:3000/api/streak?user=YOUR_GITHUB_USERNAME&theme=YOUR_THEME_NAME
```

**Invalid username — must render a styled SVG error card, not raw JSON:**

```
http://localhost:3000/api/streak?user=vivek%20Sangani
```

**Non-existent username — must render the ghost-city not-found badge:**

```
http://localhost:3000/api/streak?user=xyzabc999notreallll
```

**Useful DevTools tricks:**

- **Inspect SVG structure:** Open DevTools (`Cmd+Option+I` / `F12`) → Elements panel → expand the `<svg>` node to inspect every path, rect, and text element
- **Force a fresh fetch:** Add `&refresh=true` to bypass the cache: `http://localhost:3000/api/streak?user=YOUR_GITHUB_USERNAME&refresh=true`
- **Test different params live:** `?theme=obsidian`, `?size=large`, `?grace=2`, `?autoTheme=true`

> **⚠️ Browser XML error warning:** If your browser shows an `EntityRef: expecting ';'` error instead of rendering the SVG, it means an unescaped `&` character exists somewhere in the SVG output. All `&` characters inside SVG `<style>` blocks (e.g. in Google Fonts `@import` URLs) must be written as `&amp;`. Check `lib/svg/generator.ts` for any raw `&` in template literals.

> **💡 Tip:** For a cleaner SVG preview, open the URL in **Firefox** — it renders SVG directly in the browser with no wrapper page. Chrome wraps it in an XML viewer which can show false parse warnings.

### 2. Offline SVG Inspection with SVG Viewer

When you cannot run a dev server — or you want to inspect the raw SVG geometry in isolation — use **[SVG Viewer](https://www.svgviewer.dev/)**.

**Step-by-step:**

1. With the dev server running, open the badge URL in your browser
2. Right-click anywhere on the page → **View Page Source** (`Cmd+U` / `Ctrl+U`)
3. Select all (`Cmd+A`) → Copy (`Cmd+C`)
4. Go to [https://www.svgviewer.dev/](https://www.svgviewer.dev/)
5. Paste the SVG source into the left panel — the right panel renders it instantly

**What to check in SVG Viewer:**

- Tower geometry is correctly positioned on the isometric grid
- No overlapping paths or misaligned elements
- Text labels are readable and not clipped by the SVG boundary
- Glow filter (`<feGaussianBlur>`) renders at the correct intensity
- The `<title>` accessibility tag is present on every tower group (required by CONTRIBUTING.md a11y rules)

### 3. Running the Vitest Test Suite

CommitPulse uses **Vitest** for unit and integration tests. Run the full test suite with:

```bash
# Run all tests once (use before committing)
npm run test

# Re-run automatically on every file save (use during active development)
npm run test -- --watch

# Run only a specific test file in isolation (fastest way to debug a failure)
npm run test -- lib/calculate.test.ts

# Run only tests whose name matches a pattern
npm run test -- --reporter=verbose -t "generateVersusSVG"
```

**What a passing run looks like:**

```
✓ lib/calculate.test.ts (43 tests)
✓ lib/svg/generator.test.ts (19 tests)
✓ app/api/streak/route.test.ts (112 tests)

Test Files  70 passed (70)
Tests  819 passed (819)
```

> **🚨 All tests must pass before you open a PR.** The CI pipeline runs `npm run test` automatically on every pull request and will block merging if any test fails.

### 4. Interpreting Vitest Output

Vitest output can look intimidating at first. Here is how to read it:

```
FAIL  lib/svg/generator.test.ts

AssertionError: expected '<svg width="600"…' to include 'width="100%"'

- Expected: width="100%"
+ Received: width="600"
```

| Part of output                       | What it means                                                     |
| ------------------------------------ | ----------------------------------------------------------------- |
| `FAIL lib/svg/generator.test.ts`     | The test file that contains the failing test                      |
| `AssertionError`                     | The `expect()` assertion did not match                            |
| `- Expected`                         | What the test wanted to see in your output                        |
| `+ Received`                         | What your code actually produced                                  |
| `stderr \| …`                        | Expected console output from error-handling tests — **not a bug** |
| `✓ lib/calculate.test.ts (43 tests)` | This file passed — all good                                       |

**Interpreting SVG URL responses in the browser:**

| What you see                                 | What it means                                              |
| -------------------------------------------- | ---------------------------------------------------------- |
| Animated isometric city renders correctly    | ✅ Everything is working                                   |
| Ghost-city badge with "NOT FOUND" label      | ✅ Working — the username doesn't exist on GitHub          |
| Styled error card with "Invalid username"    | ✅ Working — the username format was invalid               |
| Raw JSON `{"error":"Invalid parameters"...}` | ❌ Bug — validation errors must return SVG, not JSON       |
| Browser XML parse error / blank white page   | ❌ Bug — unescaped `&` or malformed SVG in generator       |
| `401 Unauthorized` in the terminal           | ❌ Your `GITHUB_PAT` in `.env.local` is missing or invalid |

### 5. Checking Branch Coverage Before Pushing

The CI pipeline enforces a **minimum 70% branch coverage** across all `lib/` files. If your PR drops coverage below this threshold, it will be **blocked from merging automatically** — no exceptions.

Always run the coverage report locally before pushing:

```bash
npm run test:coverage
```

The output shows a table like this:

```
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|------------------
lib/svg/generator  |   72.22 |   49.73  |  72.22  |  72.72  | 823-885,1116,1136
lib/calculate      |   99.00 |   93.54  | 100.00  |  98.92  | 167
```

**What each column means:**

| Column              | CI Gate   | What it measures                                                           |
| ------------------- | --------- | -------------------------------------------------------------------------- |
| `% Branch`          | **≥ 70%** | Every `if/else`, ternary, `??`, and `&&` path covered by at least one test |
| `% Funcs`           | ≥ 70%     | Every exported function called at least once in tests                      |
| `% Stmts`           | ≥ 70%     | Every statement executed at least once                                     |
| `Uncovered Line #s` | —         | Exact lines with no test coverage — start here when fixing gaps            |

**The most important file:** `lib/svg/generator.ts` has the most complex branch logic (auto-theme vs static, size scaling, particle generation, ghost city mode, versus mode). If you add any new `if/else` or ternary logic here, you **must** add tests that exercise both branches — otherwise coverage will drop and block your PR.

**If coverage drops below 70%:**

1. Look at the `Uncovered Line #s` column for the failing file
2. Open the file and find those exact lines
3. Identify which branch condition is untested (the `if` path? the `else`? a ternary fallback?)
4. Add a test that reaches that code path
5. Re-run `npm run test:coverage` and confirm the percentage recovered

> **Tip:** The coverage report is also generated as an HTML file. Open it in your browser for a visual, line-by-line view of exactly which branches are hit (green) and which are missed (red):

```bash
open coverage/index.html      # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html     # Windows
```

### 6. Lint and Format

Run these before every commit:

```bash
# Auto-format all files to match the project's Prettier config
npm run format

# Check for any remaining linting errors
npm run lint
```

Fix every error before pushing. CI will fail if either check reports issues.

---

## 🤝 Contributor Onboarding

### 📁 Project Structure

```text
app/api/streak/route.ts       → API route for SVG generation
lib/github.ts                 → GitHub GraphQL API client
lib/calculate.ts              → Streak calculation logic
lib/svg/generator.ts          → SVG rendering engine
lib/svg/themes.ts             → Theme configuration system
utils/time.ts                 → UTC & timezone utilities
types/index.ts                → Shared TypeScript interfaces
```

---

### ⚠️ Local Setup Troubleshooting

Common issues during setup:

- **401 Unauthorized** → Invalid or missing `GITHUB_TOKEN`
- **MongoDB errors** → `MONGODB_URI` is optional for local development
- **Empty SVG output** → Ensure the GitHub username exists and has public contributions

---

### 🌱 Beginner-Friendly Contribution Areas

Good first contributions:

- Documentation improvements
- New theme presets
- SVG styling enhancements
- UI polish and accessibility improvements

---

### 🔁 Simplified PR Workflow

```text
Fork Repository
      ↓
Create Branch
      ↓
Make Changes
      ↓
Run Tests & Lint
      ↓
Open Pull Request
```

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

- All logic changes must be backward-compatible (no breaking the default behavior)
- Include a code comment explaining _why_ the logic works, not just _what_ it does
- If you add a new URL parameter, document it in `README.md`'s parameter table

---

## 🤖 Automated Issue Management & Claiming

CommitPulse uses a custom, lightweight **GitHub Actions** automation system to manage issues fairly. This ensures that everyone (especially during events like **GSSoC**) gets a chance to contribute and prevents "issue hoarding".

> [!IMPORTANT]
> **The Golden Rule:** You can be assigned to a maximum of **3** open issues at a time. Complete or unassign yourself from one before claiming more.

### 📋 Structured Issue Templates

To maintain high quality in our codebase, we use structured **Issue Templates** when opening new issues:

- **🐛 Bug Report Template**: For reporting visual glitches, API errors, or unexpected behavior.
- **✨ Feature Request Template**: For suggesting new isometric monolith designs, themes, or time/accuracy improvements.

By using these templates, you provide maintainers with clear details and context. Since you authored the issue, you can immediately claim it for yourself by commenting `/claim`! (Note: Issues authored by `jhasourav07` can be claimed by anyone).

### 🔍 Semantic Duplicate Detection

To help maintainers keep the repository organized and prevent multiple contributors from working on the same problem, we have an automated **Semantic Duplicate Detector** workflow in place:

- **AI-Powered Matching:** A custom GitHub Action uses the Google Gemini API (`gemini-embedding-001`) to generate text embeddings for all open issues (analyzing the title and body).
- **Cosine Similarity Scan:** The detector compares issues pairwise. If the semantic similarity between a new issue and an older issue exceeds **85%**, it flags them.
- **Automatic Flagging:** The bot will post a friendly alert comment on the newer issue pointing to the older issue, and apply a `possible-duplicate` label.
- **What this means for contributors:** Before starting to work on an issue, check if the duplicate detection bot has flagged it. If it is indeed a duplicate of an existing open issue, we encourage you to collaborate on or contribute to the original issue instead of creating a duplicate.

### 🎮 Available Commands

Our automation runs entirely through issue comments. Here is how you interact with it:

| Command                       | Who Can Use It?                                         | What It Does                                              |
| ----------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `/claim`                      | **Issue Author (or Anyone if authored by jhasourav07)** | Self-assigns the issue to you.                            |
| `/unclaim`                    | **Assigned Contributor**                                | Removes the assignment from yourself (opens it back up).  |
| `/addlabel <label1> <label2>` | **Anyone**                                              | Adds labels to the issue (e.g. `/addlabel frontend bug`). |
| `/unassign @username`         | **Maintainers Only**                                    | Removes the assignee from an issue.                       |
| `/assign @username`           | **Maintainers Only**                                    | Manually assigns someone to an issue.                     |

### ⏳ The Inactivity Policy (Assignment Expiry)

To keep the project moving, assignments are not permanent.

- **The 2-Day Rule:** If an issue has an assignee but sees **no activity for 2 days**, our automated background job will remove the assignment.
- **What counts as activity?** Posting a comment, opening a linked PR, or a maintainer adding a label.
- **Why?** It frees up stale issues so other active contributors can pick them up. If your issue expires, you can always `/claim` it again if it's still available!

### 💡 GSSoC Contributor Flow

1. Create a new issue describing the bug or feature request you want to work on using our **Structured Issue Templates** (or find an open issue you authored).
2. Comment `/claim` on the issue to lock it in.
3. Need labels? Comment `/addlabel good-first-issue` (labels must already exist in the repo).
4. Work on your code and submit a PR within 2 days to avoid expiry.
5. Once your PR is merged and the issue is closed, you can create and `/claim` your next one!

### 🆘 Troubleshooting & Edge Cases

If the bot rejects your command, check these common scenarios:

- **"Commands cannot be used on closed issues"**: You cannot claim, assign, or unassign on closed issues. Find an open one!
- **"You already have X/3 active assigned issues"**: You have reached the maximum of 3 concurrent assignments. Finish one of your current tasks before claiming a new issue. If you're stuck, use the `/unclaim` command to unassign yourself from an issue, or ask a maintainer to `/unassign` you.
- **"This issue is already assigned to @username"**: Be faster next time! Look for issues without assignees.
- **"Only the author of this issue can claim it"**: You tried to `/claim` an issue you did not create. You can only claim issues that you authored (unless the issue was authored by `jhasourav07`, which anyone can claim).
- **"The following label(s) do not exist"**: You can only add existing repo labels. The bot will reply with a list of valid labels you can use.
- **"You don't have permission"**: You tried to use `/assign` or `/unassign`. Please use `/claim` instead.

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
| Testing         | `test/generator-coverage`    |

### Commit Messages

Write **atomic commits** — one logical change per commit. Follow the [Conventional Commits](https://www.conventionalcommits.org) standard:

```
type(scope): short description in lowercase

# Examples:
feat(themes): add aurora preset with teal-pink palette
fix(calculate): handle grace period when today has zero contributions
docs(readme): add aurora theme to parameter table
refactor(generator): extract tower path builder into helper function
test(generator): add Vitest coverage for generateVersusSVG
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

> **One commit should do one thing.** A PR with 15 commits that all say "update" will be asked to be squashed before merging.

---

## 🔁 Opening a Pull Request

1. **Fork** and **Star** the repository and create your branch off `main`
2. **Make your changes** following the pillar guidelines above
3. **Test locally** — verify the SVG renders correctly at `localhost:3000/api/streak?user=YOUR_USERNAME`
4. **Open a PR** with the following template filled out:

```md
## Description

Fixes # (issue number)

## Pillar

- [ ] 🎨 Pillar 1 — New Theme Design
- [ ] 📐 Pillar 2 — Geometric SVG Improvement
- [ ] 🕐 Pillar 3 — Timezone Logic Optimization
- [ ] 🛠️ Other (Bug fix, refactoring, docs)

## Visual Preview

## Checklist before requesting a review:

- [ ] I have read the `CONTRIBUTING.md` file.
- [ ] I have tested these changes locally (`localhost:3000/api/streak?user=YOUR_USERNAME`).
- [ ] I have run `npm run format` and `npm run lint` locally and resolved all errors (CI will fail otherwise).
- [ ] I have run `npm run test` and all tests pass locally.
- [ ] I have run `npm run test:coverage` and branch coverage is at or above 70%.
- [ ] My commits follow the Conventional Commits format (e.g., `feat(themes): ...`, `fix(calculate): ...`).
- [ ] I have updated `README.md` if I added a new theme or URL parameter.
- [ ] I have started the repo.
- [ ] I have made sure that i have only one commit to merge in this PR.
- [ ] The SVG output matches the CommitPulse "premium quality" aesthetic standard (no raw elements, smooth animations, correct fonts).
- [ ] (Recommended) I joined the CommitPulse Discord server for faster collaboration, mentorship, and PR support.
```

[![Join CommitPulse Discord](https://img.shields.io/badge/Join-CommitPulse%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/Cb73bS79j)

> **PRs without a visual preview for any SVG-touching changes will be asked for one before review.**

---

## 🧹 Code Style, Testing & Quality Gates

CommitPulse enforces code quality using **ESLint** (correctness & TypeScript rules), **Prettier** (consistent formatting), and **Vitest** (unit and integration testing). All of these run automatically in CI on every PR — there are no exceptions.

### Before Every Commit

Run these three commands locally before you open a PR:

```bash
# 1. Auto-format all files to match the project's Prettier config
npm run format

# 2. Check for any remaining linting errors
npm run lint

# 3. Ensure all tests pass
npm run test

# 4. Verify branch coverage stays at or above 70%
npm run test:coverage
```

Fix every error before pushing. If you add new logic or features, you are expected to write tests for them.

### Coverage Threshold

The CI pipeline enforces a **minimum 70% branch coverage** across all measured files. This is not optional — PRs that drop coverage below this threshold are automatically blocked from merging.

The threshold exists because branch coverage (covering every `if/else`, ternary, and `??` path) is the most reliable indicator that edge cases are tested. Statement coverage alone is not enough.

**Files most likely to affect the gate:**

| File                      | Why it matters                                                             |
| ------------------------- | -------------------------------------------------------------------------- |
| `lib/svg/generator.ts`    | Most complex branching — auto-theme, size scaling, ghost city, versus mode |
| `lib/calculate.ts`        | Streak logic — grace period, timezone edge cases, empty calendars          |
| `app/api/streak/route.ts` | Request handling — validation, rate limit, not-found, error paths          |

If you add a new `if/else`, ternary, or optional-chain (`?.`) anywhere in `lib/`, you must add a test covering both the truthy and falsy paths before pushing.

### Testing Guidelines

We use **Vitest** alongside **React Testing Library** for our test suite.

- **File Naming:** Test files must be co-located with the code they test and end in `.test.ts` or `.test.tsx` (e.g., `lib/calculate.test.ts`).
- **Unit Tests:** All core utility and calculation functions (like streak counting or timezone logic) must have exhaustive unit tests covering edge cases (zero contributions, grace periods, leap years).
- **Component Tests:** UI components must verify correct rendering, prop handling, and accessibility. We mock animation libraries (like `framer-motion`) to keep DOM tests stable.
- **API Tests:** API routes must be tested to ensure correct status codes, caching headers, and parameter validation. External network calls (like the GitHub GraphQL API) must be mocked using `vi.spyOn(global, 'fetch')` so tests are fast, deterministic, and run offline. For routes that depend on optional environment variables (like `MONGODB_URI` for `/api/track-user`), write tests for **both the bypass path** (env var absent) and the **live path** (env var present with mocked DB).
- **Humanic Comments:** Comments in test files should explain _why_ a test exists or what specific edge-case it covers, rather than just repeating what the code does line-by-line.

> **🚨 GitHub Actions CI Gate**
> Our CI pipeline runs `npm run lint`, `npm run format --check`, `npm run test`, and `npm run test:coverage` automatically on **every pull request**. If your code fails any check, **the PR will be blocked from merging** until the issues are resolved. There is no way to bypass this gate — so run the commands locally first and save yourself the round-trip.

**Key style rules:**

- All functions must have **explicit TypeScript return types**
- Use the `BadgeParams`, `StreakStats`, and `BadgeTheme` interfaces from `types/index.ts` — **never use `any`**; create a typed interface for the data shape instead
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
