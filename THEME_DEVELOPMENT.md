# 🎨 Theme Development Guide

**A beginner-friendly guide to creating and submitting custom themes for CommitPulse.**

> Whether you're a designer with years of experience or someone exploring color harmony for the first time, this guide will help you create a theme that feels cohesive, accessible, and ready for the CommitPulse gallery.

---

## 📋 Table of Contents

- [Understanding Theme Architecture](#-understanding-theme-architecture)
- [Color Harmony Principles](#-color-harmony-principles)
- [Step-by-Step Theme Creation](#-step-by-step-theme-creation)
- [Local Testing & Preview](#-local-testing--preview)
- [Existing Theme Styles](#-existing-theme-styles)
- [Common Pitfalls & Fixes](#-common-pitfalls--fixes)
- [PR Submission Checklist](#-pr-submission-checklist)
- [PR Description Template](#-pr-description-template)
- [Frequently Asked Questions](#-frequently-asked-questions)

---

## 🎯 Understanding Theme Architecture

Every CommitPulse theme is built from **4 core color values**. Understanding each one is the foundation of theme design.

### The 4 Theme Colors

| Color          | Property   | Role in SVG                                                                                                          | Example                 |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Background** | `bg`       | The main canvas. Sets the overall mood and contrast foundation. This is what users see first.                        | `#0d1117` (GitHub dark) |
| **Text**       | `text`     | Labels, numbers, and contribution counts. Must have high contrast against `bg` for accessibility.                    | `#c9d1d9`               |
| **Accent**     | `accent`   | The primary visual element. Used for the 3D towers, radar line, and glow effects. This is your theme's "hero color". | `#58a6ff`               |
| **Negative**   | `negative` | Error indicator / shadow color. Used sparingly for depth and visual hierarchy. Creates visual balance.               | `#f85149`               |

### How They Work Together

```
[Background] ← serves as canvas for → [Text + Accent + Negative]
                                        ↓
                                    Contrast hierarchy
                                    creates readable visualization
```

**In the isometric SVG:** The towers are rendered using the `accent` color with shadow/depth via the `negative` color. Text overlays use the `text` color for readability. The entire composition sits on top of the `bg` color.

---

## 🌈 Color Harmony Principles

Creating a cohesive theme doesn't require a design degree. Follow these principles to ensure your colors work well together.

### 1. Contrast is King (WCAG AA Standard)

Text and background colors must have sufficient contrast to be readable by everyone, including people with color vision deficiency.

**WCAG AA Standard:** Minimum contrast ratio of **4.5:1 for normal text**, **3:1 for large text**.

> **How to check:** Use an online contrast checker like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or [Coolors Contrast Checker](https://coolors.co/contrast-checker). Paste your `text` color and `bg` color — the ratio should be ≥ 4.5:1.

**✅ Good Example:**

- Background: `#0d1117` (very dark)
- Text: `#c9d1d9` (light gray)
- Contrast Ratio: **13.2:1** ✓

**❌ Poor Example:**

- Background: `#333333`
- Text: `#555555`
- Contrast Ratio: **1.4:1** ✗ (unreadable)

### 2. Color Family Consistency

Colors within a theme should come from the same **color family** or **palette scheme** to feel cohesive.

**Three approaches:**

| Approach          | Description                            | Example                                         |
| ----------------- | -------------------------------------- | ----------------------------------------------- |
| **Monochromatic** | Shades and tints of one color          | Blues and light blues (Ocean theme)             |
| **Complementary** | Colors opposite on the color wheel     | Purple accent + yellow tones (Aurora Cyberpunk) |
| **Analogous**     | Colors next to each other on the wheel | Blues + cyans + teals (common in dark themes)   |

**✅ Cohesive theme:** All colors feel like they belong together.  
**❌ Chaotic theme:** Colors feel randomly selected, creating visual tension.

### 3. Accent Color Matters Most

The `accent` color is the hero of your theme. It should:

- **Pop visually** against the background
- **Not be too bright** that it causes eye strain
- **Avoid pure primary colors** (pure #FF0000, #00FF00, #0000FF) unless intentionally vibrant
- **Have emotional resonance** — does it feel energetic? calm? nostalgic?

**✅ Good accents:** `#58a6ff`, `#64ffda`, `#bd93f9` (intentional saturation)  
**❌ Poor accents:** `#ff0000`, `#00ff00` (jarring, overused)

### 4. Avoid Color Clashing

Two colors clash when they're too similar in brightness (lightness) but different in hue, or when they're both high-saturation opposites.

**Problem Example:**

- Background: `#1a1a2e` (very dark blue)
- Accent: `#1e66f5` (bright saturated blue)
- **Result:** The blue accent doesn't pop enough, and the overall theme feels monotonous.

**Fix:** Use an accent from a **different hue family** — like cyan (`#64ffda`) or purple (`#bd93f9`).

### 5. Shadow / Negative Color Balance

The `negative` color should be:

- **Less saturated** than the accent
- **Complementary in tone** — not a random choice
- **Subtle in the visualization** — it's for depth, not dominance

**Good pattern:** Use the `negative` as a darker or warmer counterbalance to a cool accent.

| Accent                  | Negative             | Relationship      |
| ----------------------- | -------------------- | ----------------- |
| `#58a6ff` (cool blue)   | `#f85149` (warm red) | Warm-cool balance |
| `#64ffda` (cool cyan)   | `#ff6b6b` (warm red) | Warm-cool balance |
| `#bd93f9` (cool purple) | `#ff5555` (warm red) | Warm-cool balance |

---

## 📝 Step-by-Step Theme Creation

Follow these steps to create your custom theme.

### Step 1: Open the Themes File

Open [lib/svg/themes.ts](lib/svg/themes.ts) in your editor.

This file contains all registered themes. You'll add your new theme here.

### Step 2: Choose Your 4 Colors

Before touching code, decide on your 4 colors and document them:

```
My Theme: "Midnight Dream"
- Background: #1a1a2e (very dark blue-gray)
- Text: #e0e0ff (light lavender)
- Accent: #a78bfa (purple)
- Negative: #ef4444 (red)
```

**Tips for choosing:**

- Start with the background (sets the mood)
- Choose text that contrasts well (aim for 4.5:1 ratio)
- Pick an accent that pops but doesn't strain
- Select a negative color that balances the accent

### Step 3: Find an Existing Theme to Reference

Look at a similar theme in [lib/svg/themes.ts](lib/svg/themes.ts) and use it as a template.

For example, if you want a dark theme with a purple accent, reference the `dracula` theme:

```typescript
dracula: makeTheme('282a36', 'f8f8f2', 'bd93f9', 'ff5555'),
```

### Step 4: Add Your Theme to the Themes Object

Locate the `export const themes` object and add your theme using the `makeTheme()` helper:

```typescript
export const themes: Record<string, BadgeTheme> = {
  dark: makeTheme('0d1117', 'c9d1d9', '58a6ff', 'f85149'),
  light: makeTheme('ffffff', '24292f', '0969da', 'cf222e'),
  // ... existing themes ...

  // ✨ ADD YOUR THEME HERE ✨
  midnight_dream: makeTheme('1a1a2e', 'e0e0ff', 'a78bfa', 'ef4444'),
};
```

**Naming convention:**

- Use lowercase with underscores for spaces: `my_awesome_theme`
- Keep names short and descriptive
- Avoid generic names like `theme123` or `colors`

### Step 5: Verify Your Hex Colors

Double-check that your hex colors:

- Are exactly 6 characters (without the `#`)
- Use valid hex format (0-9, a-f)
- Don't have leading `#` symbols (the `makeTheme()` helper adds them)

✅ Correct: `makeTheme('1a1a2e', 'e0e0ff', 'a78bfa', 'ef4444')`  
❌ Incorrect: `makeTheme('#1a1a2e', '#e0e0ff', '#a78bfa', '#ef4444')`

### Step 6: Save and Test Locally

Save your changes and follow the [Local Testing & Preview](#-local-testing--preview) section below.

### Step 7: Submit Your PR

Once tested and verified, follow the [PR Submission Checklist](#-pr-submission-checklist) and open a pull request.

---

## 🖥️ Local Testing & Preview

Before opening a PR, you must test your theme locally to verify it looks correct.

### Prerequisites

You should have CommitPulse running locally. If not, follow the [Local Setup](CONTRIBUTING.md#-local-setup) guide first.

### Running the Dev Server

```bash
npm install        # Install dependencies (if first time)
npm run dev        # Start development server
```

Your dev server runs at `http://localhost:3000`.

### Preview Your Theme

Open your browser and visit:

```
http://localhost:3000/api/streak?user=YOUR_GITHUB_USERNAME&theme=YOUR_THEME_NAME
```

**Example:**

```
http://localhost:3000/api/streak?user=jhasourav07&theme=midnight_dream
```

This renders the SVG directly in your browser.

### Visual Inspection Checklist

Once the badge loads, check:

- [ ] **Text is readable** — Can you easily read the numbers and labels?
- [ ] **Accent color pops** — Does the 3D tower stand out without straining?
- [ ] **Negative color is subtle** — Does the shadow color add depth without dominating?
- [ ] **No color bleeding** — Are the colors sharp and contained?
- [ ] **Animation is smooth** — Do the radar line and glow effects feel natural?

### Contrast Verification Using Browser Tools

**Method 1: Browser DevTools (Chrome/Edge)**

1. Right-click the SVG → **Inspect**
2. Find a `<text>` element with your text color
3. Click **Inspect** on that element
4. In the **Styles** panel, check the text color
5. Click the color swatch next to the hex value
6. The color picker shows contrast ratio against the background

**Method 2: Online Contrast Checker**

1. Extract your color values from the code
2. Visit [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
3. Paste your `text` color and `bg` color
4. Verify ratio is ≥ **4.5:1**

**Example:**

```
Foreground: #e0e0ff
Background: #1a1a2e
Contrast Ratio: 8.4:1 ✓ (passes WCAG AA)
```

### Responsive Testing

The SVG should look good in:

- **Desktop browsers** (Chrome, Firefox, Safari, Edge)
- **Mobile browsers** (responsive sizing)

Test by resizing your browser window and confirming the visualization stays crisp.

---

## 🎭 Existing Theme Styles

Study these existing themes to understand different design approaches and mood.

| Theme                | Mood                   | Best Use Case                   | Color Style             | Contrast |
| -------------------- | ---------------------- | ------------------------------- | ----------------------- | -------- |
| **dark**             | Modern, professional   | GitHub profile README           | Cool blues on dark      | 13.2:1   |
| **light**            | Clean, minimal         | Light-themed portfolios         | Cool blues on white     | 8.6:1    |
| **neon**             | Cyberpunk, energetic   | Tech portfolio, flashy profiles | Cyan & magenta on black | 4.5:1    |
| **github**           | Official, neutral      | GitHub-native aesthetic         | GitHub green on dark    | 4.5:1    |
| **dracula**          | Dark academia, elegant | Designer portfolios             | Purple on dark gray     | 8.1:1    |
| **ocean**            | Calm, immersive        | Creative profiles               | Cyan on dark blue       | 6.4:1    |
| **sunset**           | Warm, energetic        | Personal brands                 | Orange on very dark     | 7.2:1    |
| **forest**           | Natural, earthy        | Environmental / sustainability  | Green on very dark      | 7.8:1    |
| **rose**             | Romantic, soft         | Artistic/creative profiles      | Pink on very dark       | 5.9:1    |
| **nord**             | Arctic, minimalist     | Tech / Nordics fans             | Light blue on dark gray | 6.2:1    |
| **synthwave**        | Retro-futuristic       | Retro enthusiasts               | Hot pink on very dark   | 4.5:1    |
| **gruvbox**          | Warm, retro            | Developer-friendly              | Orange on dark          | 5.4:1    |
| **aurora_cyberpunk** | Sci-fi, neon           | Futuristic profiles             | Purple on very dark     | 6.1:1    |
| **highcontrast**     | Accessible, bold       | High-visibility needs           | Orange on black         | 10.8:1   |
| **catppuccin_latte** | Light, friendly        | Light-themed systems            | Blue on cream           | 9.2:1    |

---

## ⚠️ Common Pitfalls & Fixes

Avoid these common mistakes when creating your theme.

| Problem                                 | Why It Happens                                                  | Fix                                                                                                                    | Example                                                                               |
| --------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Low text contrast**                   | Picking `text` and `bg` colors without checking ratio           | Use a contrast checker tool. Aim for 4.5:1 or higher. Test before committing.                                          | `#333333` text on `#555555` bg = 1.4:1 ❌ → Change to `#ffffff` on `#000000` = 21:1 ✓ |
| **Too many unrelated colors**           | Trying to include too many distinct hues in one theme           | Stick to 2-3 color families max. Use shades/tints of the same hue.                                                     | ❌ Purple + lime + orange + cyan → ✓ Purple + cyan (complementary pair)               |
| **Accent too close to background**      | Choosing accent color in the same hue family as background      | Use a contrasting accent hue. If `bg` is blue, pick accent that's not blue (orange, purple, yellow, etc.).             | ❌ `#1a1a2e` (dark blue) + `#1e66f5` (bright blue) → ✓ `#1a1a2e` + `#a78bfa` (purple) |
| **Shadow too harsh**                    | Using a color that's too saturated or too bright for `negative` | Desaturate and tone down the `negative` color. Use complementary colors sparingly.                                     | ❌ `#ff0000` (pure bright red) → ✓ `#ef4444` (muted red)                              |
| **Gradient overpowering visualization** | Trying to add a gradient effect where solid colors work better  | CommitPulse uses solid colors by design. Stick with hex values, not gradients.                                         | ❌ `linear-gradient(...)` → ✓ Solid hex: `#a78bfa`                                    |
| **Unclear theme name**                  | Using vague or non-descriptive names                            | Use names that hint at the mood: `midnight_dream`, `ocean_breeze`, `neon_nights`. Avoid: `theme1`, `colors123`, `new`. | ❌ `my_theme` → ✓ `cyberpunk_neon`                                                    |

---

## ✅ PR Submission Checklist

Before opening a pull request, verify you've completed every step:

- [ ] **Theme added to [lib/svg/themes.ts](lib/svg/themes.ts)** — Your new theme object is in the `themes` export
- [ ] **Theme name follows convention** — Lowercase, underscores for spaces, descriptive (`midnight_dream`, not `theme1`)
- [ ] **Colors tested locally** — You've previewed the theme at `/api/streak?user=YOUR_USERNAME&theme=YOUR_THEME`
- [ ] **Contrast verified** — Text color has ≥ 4.5:1 contrast against background (checked with WebAIM or DevTools)
- [ ] **Theme feels cohesive** — All 4 colors work together and don't clash
- [ ] **No hex errors** — Hex values are exactly 6 characters, lowercase, no `#` symbol
- [ ] **Screenshot or GIF included** — Attach a visual showing how the theme looks
- [ ] **PR description complete** — Follows the template below with inspiration and color reasoning

---

## 📄 PR Description Template

Copy this template into your PR description and fill it out:

```markdown
## 🎨 Theme Submission: [YOUR_THEME_NAME]

### Description

Brief description of your theme's inspiration and mood.

**Example:** "Inspired by late-night city skylines, this theme features deep purples and soft cyan highlights for a calm yet sophisticated aesthetic."

### Color Choices

| Color      | Value     | Why This Color?                               |
| ---------- | --------- | --------------------------------------------- |
| Background | `#1a1a2e` | Dark blue-gray creates calm base              |
| Text       | `#e0e0ff` | Light lavender for high contrast              |
| Accent     | `#a78bfa` | Purple bridges cool & warm, visually striking |
| Negative   | `#ef4444` | Warm red balances cool palette                |

### Contrast Verification

- Text Contrast Ratio: **8.4:1** ✓ (WCAG AA compliant)
- Tested with: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Aesthetic Inspiration

What inspired this theme? Link to references, mood boards, or existing themes you drew from.

**Example:** "Inspired by Dracula theme but with warmer purple tones. Color harmony from [Coolors Palette](https://coolors.co)."

### Preview

Attach a screenshot showing the SVG badge in light & dark contexts:

![Theme Preview](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME&theme=YOUR_THEME_NAME)

### Testing Completed

- [x] Tested locally at `/api/streak?user=YOUR_USERNAME&theme=YOUR_THEME`
- [x] Verified contrast meets WCAG AA standard
- [x] Confirmed colors harmonize and feel cohesive
- [x] SVG renders cleanly without artifacts
```

---

## ❓ Frequently Asked Questions

### Q: Can I use hex colors with lowercase and uppercase mixed?

**A:** Yes! Hex colors are case-insensitive. Both `#A78BFA` and `#a78bfa` are valid and identical. For consistency with CommitPulse style, use **lowercase**.

### Q: What if my theme doesn't look good in all light settings?

**A:** The `AUTO_THEME_LIGHT` and `AUTO_THEME_DARK` constants handle light/dark mode switching. Individual themes don't need auto-switching. If you want your theme to work in both contexts, test it on light and dark backgrounds separately.

### Q: Can I submit a theme that's very similar to an existing one?

**A:** We encourage themes that bring something new to the gallery. Small tweaks to existing themes are welcome, but ensure your theme has a distinct identity. Focus on:

- Different color harmony approach
- New mood or aesthetic
- Underexplored color combinations

### Q: What's the difference between `accent` and `negative`?

**A:**

- **`accent`:** Primary visual color. Used for the main towers and eye-catching elements. Should pop.
- **`negative`:** Shadow/error color. Used sparingly for depth and balance. Should be subtle.

Think of `accent` as the "hero" and `negative` as the "supporting actor."

### Q: Can I use gradients or patterns?

**A:** CommitPulse uses solid hex colors by design. Gradients and patterns are not supported in the theme system. Stick with solid 6-character hex codes.

### Q: How do I know if my contrast ratio is good enough?

**A:** Follow the **WCAG AA standard:**

- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text:** Minimum 3:1 contrast ratio

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — if the ratio shows **4.5 or higher**, you're good.

### Q: What if I submit a theme and it gets rejected?

**A:** Maintainers provide feedback on why. Common reasons:

- Low contrast (fix by rechecking the ratio)
- Colors don't harmonize (try choosing colors from the same family)
- Name unclear (rename to be more descriptive)

You can iterate and resubmit. **This is normal and encouraged.**

### Q: Can I add more than 4 colors?

**A:** The current theme system uses 4 colors: `bg`, `text`, `accent`, and `negative`. If you need more sophisticated color handling, open an issue on GitHub to discuss expanding the theme architecture.

---

## 🚀 Ready to Submit?

You've learned the principles, created your theme, tested it locally, and prepared your PR description.

**You're ready.**

### Final Words

> If you're hesitant because you're "not a designer" or "not sure if the colors are perfect" — **submit it anyway.** The CommitPulse maintainers are here to help. We'll collaborate with you to refine the theme, suggest tweaks, or explain what's working and what isn't.
>
> Every theme in the gallery started as someone's idea. That someone might be you.

**Open your pull request.** The community is ready to see what you create. 🎨

---

### Need Help?

- 📖 Read [CONTRIBUTING.md](CONTRIBUTING.md) for general contribution guidelines
- 🐙 Check [lib/svg/generator.ts](lib/svg/generator.ts) to see how themes are applied
- 🔌 Explore [app/api/streak/route.ts](app/api/streak/route.ts) to understand the API integration
- 💬 Join the [CommitPulse Discord](https://discord.gg/f84SDraEBH) for real-time questions

---

**Happy theming! 🎨✨**
