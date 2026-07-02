# 🎨 Customization Guide & Parameter Reference

CommitPulse is designed to be fully customizable. Every visual attribute is controllable via a URL parameter, following a clear priority chain:

```
URL Parameter > Theme Default > System Fallback
```

---

## 📋 Parameter Reference

| Parameter           | Type      | Required   | Default                        | Description                                                                                                                                                                                                                                |
| ------------------- | --------- | ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `user`              | `string`  | ✅ **Yes** | —                              | GitHub username to render                                                                                                                                                                                                                  |
| `theme`             | `string`  | No         | `dark`                         | Preset theme name (see below)                                                                                                                                                                                                              |
| `bg`                | `hex`     | No         | Theme default                  | Background color — **without** `#`                                                                                                                                                                                                         |
| `accent`            | `hex`     | No         | Theme default                  | Tower & glow color — **without** `#`                                                                                                                                                                                                       |
| `text`              | `hex`     | No         | Theme default                  | Label & stat text color — **without** `#`                                                                                                                                                                                                  |
| `radius`            | `number`  | No         | `8`                            | Border corner radius in pixels                                                                                                                                                                                                             |
| `border`            | `string`  | No         | —                              | Custom stroke color around the main SVG container — **without** `#`                                                                                                                                                                        |
| `speed`             | `string`  | No         | `8s`                           | Radar scan duration (`2s`–`20s`, default `8s`)                                                                                                                                                                                             |
| `scale`             | `string`  | No         | `linear`                       | Tower height scaling: `linear`, `log` (logarithmic), or `sqrt` (square root)                                                                                                                                                               |
| `size`              | `string`  | No         | `medium`                       | Badge dimensions: `small` (400×280), `medium` (600×420), `large` (800×560)                                                                                                                                                                 |
| `font`              | `string`  | No         | CommitPulse default typography | Any **Google Font** name (e.g. `Orbitron`, `Inter`)                                                                                                                                                                                        |
| `refresh`           | `boolean` | No         | `false`                        | Bypass cache for real-time data                                                                                                                                                                                                            |
| `year`              | `string`  | No         | —                              | Calendar year to render (e.g. `2023`, `2024`)                                                                                                                                                                                              |
| `days`              | `number`  | No         | —                              | Number of days of contribution history to fetch and render. Accepts a positive integer up to `365` (e.g. `days=90`).                                                                                                                       |
| `from`              | `string`  | No         | —                              | Start date for the contribution query in ISO 8601 format (e.g. `2023-01-01`). Must be less than or equal to `to` date.                                                                                                                     |
| `to`                | `string`  | No         | —                              | End date for the contribution query in ISO 8601 format (e.g. `2023-12-31`). Must be greater than or equal to `from` date.                                                                                                                  |
| `hide_title`        | `boolean` | No         | `false`                        | Hide GitHub username/title from the SVG badge                                                                                                                                                                                              |
| `custom_title`      | `string`  | No         | —                              | Render a custom title instead of username/title                                                                                                                                                                                            |
| `custom_subtitle`   | `string`  | No         | —                              | Render a custom subtitle right below the title                                                                                                                                                                                             |
| `hide_background`   | `boolean` | No         | `false`                        | Remove the background rect, letting the monolith float on the page                                                                                                                                                                         |
| `hide_stats`        | `boolean` | No         | `false`                        | Hides the bottom row displaying Current Streak, Annual Sync Total, and Peak Streak stats when set to `true` or `1`.                                                                                                                        |
| `tz`                | `string`  | No         | Omitted = UTC                  | IANA timezone (e.g. `Asia/Kolkata`, `America/New_York`) — aligns "today" with the user local midnight. Note: `?tz=UTC` is valid but cached separately from omitting `tz`.                                                                  |
| `lang`              | `string`  | No         | `en`                           | Language code for labels (`en`, `es`, `hi`, `fr`, `pt`, `ko`, `ja`, `de`, `zh`)                                                                                                                                                            |
| `view`              | `string`  | No         | `default`                      | Rendering mode: `default` (3D Monolith), `monthly` (Compact monthly stats), `heatmap` (flat 2D heatmap), `pulse` (heartbeat pulse), `skyline` (city skyline), `languages` (top languages skyline), or `constellation` (celestial star-map) |
| `entrance`          | `string`  | No         | `rise`                         | Entrance animation for towers: `rise` (default), `fade`, `slide`, or `none`.                                                                                                                                                               |
| `disable_particles` | `boolean` | No         | `false`                        | Disable floating heat particle animations on the monolith towers when set to `true` or `1`.                                                                                                                                                |
| `glow`              | `boolean` | No         | `true`                         | Enable neon-style glow/blur effects for the towers. Accepts `true`/`1` (enable) or `false`/`0` (disable).                                                                                                                                  |
| `delta_format`      | `string`  | No         | `percent`                      | Format for month-over-month delta in monthly view: `percent` (e.g. +12%), `absolute` (e.g. +15 commits), or `both`                                                                                                                         |
| `width`             | `number`  | No         | `300`                          | Custom width for the SVG canvas (applies to `view=monthly`, `pulse`, `skyline`)                                                                                                                                                            |
| `height`            | `number`  | No         | `120`                          | Custom height for the SVG canvas (applies to `view=monthly`, `pulse`, `skyline`)                                                                                                                                                           |
| `grace`             | `number`  | No         | `1`                            | Grace period in days before a streak resets (0–7). `grace=0` = strict mode (no missed days), `grace=2` = lenient (forgives up to 2 missed days). Default is `1`.                                                                           |
| `mode`              | `string`  | No         | `commits`                      | Rendering mode: `commits` (default) or `loc` (Lines of Code landscape)                                                                                                                                                                     |
| `repo`              | `string`  | No         | —                              | Render the monolith for a specific repository (e.g. `owner/repo`) instead of the whole profile                                                                                                                                             |
| `org`               | `string`  | No         | —                              | Organization name to generate a Mega-City for                                                                                                                                                                                              |
| `labels`            | `boolean` | No         | `false`                        | Render optional 3D isometric month headers and weekday labels                                                                                                                                                                              |
| `labelColor`        | `hex`     | No         | —                              | Custom text color for the isometric labels — **without** `#`                                                                                                                                                                               |
| `versus`            | `string`  | No         | —                              | GitHub username of an opponent to compare against in side-by-side versus mode                                                                                                                                                              |
| `shading`           | `boolean` | No         | `false`                        | Apply intensity-based opacity shading to tower faces so lower intensity levels appear slightly dimmer                                                                                                                                      |
| `dim_weekends`      | `boolean` | No         | `false`                        | Dim towers representing weekend commits (Saturdays and Sundays) to `opacity: 0.3` to highlight weekday schedules                                                                                                                           |
| `opacity`           | `number`  | No         | `1.0`                          | Global opacity scalar for all tower fill-opacity values (0.1–1.0). `opacity=0.5` = semi-transparent ghost look. `opacity=0.8` = faded, great on light backgrounds.                                                                         |
| `gradient`          | `boolean` | No         | `false`                        | Opt-in to show volumetric gradients on the monolith floor                                                                                                                                                                                  |
| `gradient_stops`    | `string`  | No         | —                              | Comma-separated list of hex colors (e.g. `ff6b35,ff007f`) for custom floor gradient. Requires `gradient=true` and at least two valid colors. Hex prefix `#` is optional.                                                                   |
| `gradient_dir`      | `string`  | No         | `vertical`                     | Direction of the volumetric floor gradient: `vertical` (default), `horizontal`, or `diagonal`.                                                                                                                                             |
| `minify`            | `boolean` | No         | `true`                         | Enable lightweight SVG minification to reduce payload size by 15–30%. Accepts `true`/`1` (enable) or `false`/`0` (disable).                                                                                                                |

> All parameters below are optional except `user`. Append them to the base URL as query string key-value pairs (e.g. `?user=YOUR_USERNAME&theme=neon&size=large`). Boolean parameters accept `true` or `false`. Hex color values are provided **without** the `#` prefix.

| Parameter         | Description                                                                                     | Default            | Allowed Values / Constraints                                                    | Example                    |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------- | -------------------------- |
| `user`            | GitHub username to render (Required)                                                            | —                  | Any valid GitHub username                                                       | `?user=jhasourav07`        |
| `theme`           | Preset theme name                                                                               | `dark`             | `auto`, `dark`, `neon`, `dracula`, `github`, `light`, `gruvbox`, `random`, etc. | `?theme=dracula`           |
| `bg`              | Background color                                                                                | Theme default      | Hex color code (without `#`)                                                    | `?bg=0d1117`               |
| `accent`          | Tower & glow color                                                                              | Theme default      | Hex color code (without `#`)                                                    | `?accent=58a6ff`           |
| `text`            | Label & stat text color                                                                         | Theme default      | Hex color code (without `#`)                                                    | `?text=c9d1d9`             |
| `radius`          | Border corner radius in pixels                                                                  | `8`                | Numeric value                                                                   | `?radius=16`               |
| `border`          | Custom stroke color around the SVG container                                                    | —                  | Hex color code (without `#`)                                                    | `?border=ff0000`           |
| `speed`           | Radar scan duration                                                                             | `8s`               | `2s`–`20s`                                                                      | `?speed=4s`                |
| `scale`           | Tower height scaling                                                                            | `linear`           | `linear`, `log`, `sqrt`                                                         | `?scale=sqrt`              |
| `size`            | Badge dimensions                                                                                | `medium`           | `small`, `medium`, `large`                                                      | `?size=large`              |
| `font`            | Custom font for text                                                                            | Default typography | Any valid Google Font name                                                      | `?font=Orbitron`           |
| `refresh`         | Bypass cache for real-time data                                                                 | `false`            | `true`, `false`                                                                 | `?refresh=true`            |
| `year`            | Calendar year to render                                                                         | Current year       | `2023`, `2024`, etc.                                                            | `?year=2023`               |
| `hide_title`      | Hide GitHub username/title                                                                      | `false`            | `true`, `false`                                                                 | `?hide_title=true`         |
| `custom_title`    | Custom header title text                                                                        | —                  | Any text string (XML-escaped)                                                   | `?custom_title=My%20Pulse` |
| `custom_subtitle` | Custom subtitle text right below title                                                          | —                  | Any text string (XML-escaped)                                                   | `?custom_subtitle=Dev`     |
| `hide_background` | Remove the background rect                                                                      | `false`            | `true`, `false`                                                                 | `?hide_background=true`    |
| `hide_stats`      | Hide bottom row displaying stats                                                                | `false`            | `true`, `false`                                                                 | `?hide_stats=true`         |
| `tz`              | IANA timezone                                                                                   | `UTC`              | Valid IANA timezone                                                             | `?tz=Asia/Kolkata`         |
| `lang`            | Language code for labels                                                                        | `en`               | `en`, `es`, `hi`, `fr`, `pt`, `ko`, `ja`, `de`, `zh`                            | `?lang=hi`                 |
| `view`            | Rendering mode                                                                                  | `default`          | `default`, `monthly`, `heatmap`, `pulse`, `skyline`, `languages`                | `?view=skyline`            |
| `entrance`        | Entrance animation for towers                                                                   | `rise`             | `rise`, `fade`, `slide`, `none`                                                 | `?entrance=fade`           |
| `delta_format`    | Month-over-month delta format (`view=monthly`)                                                  | `percent`          | `percent`, `absolute`, `both`                                                   | `?delta_format=absolute`   |
| `width`           | Custom width for SVG canvas (`view=monthly`, `pulse`, `skyline`)                                | `300`              | Numeric value                                                                   | `?width=400`               |
| `height`          | Custom height for SVG canvas (`view=monthly`, `pulse`, `skyline`)                               | `120`              | Numeric value                                                                   | `?height=150`              |
| `grace`           | Grace period in days before streak resets (see [Grace Period Examples](#grace-period-examples)) | `1`                | `0`–`7`                                                                         | `?grace=2`                 |
| `mode`            | Base data rendering mode                                                                        | `commits`          | `commits`, `loc`                                                                | `?mode=loc`                |
| `repo`            | Render monolith for a specific repository                                                       | —                  | `owner/repo`                                                                    | `?repo=vercel/next.js`     |
| `org`             | Organization name to generate a Mega-City for                                                   | —                  | Valid GitHub organization name                                                  | `?org=vercel`              |
| `labels`          | Render optional isometric month/weekday labels                                                  | `false`            | `true`, `false`                                                                 | `?labels=true`             |
| `labelColor`      | Custom text color for isometric labels                                                          | —                  | Hex color code (without `#`)                                                    | `?labelColor=ffffff`       |
| `versus`          | Compare against an opponent side-by-side                                                        | —                  | Any valid GitHub username                                                       | `?versus=octocat`          |
| `shading`         | Apply intensity-based opacity shading to tower faces                                            | `false`            | `true`, `false`                                                                 | `?shading=true`            |
| `dim_weekends`    | Dim weekend towers (Saturdays and Sundays)                                                      | `false`            | `true`, `false`                                                                 | `?dim_weekends=true`       |
| `opacity`         | Global opacity scalar for tower fill                                                            | `1.0`              | `0.1`–`1.0`                                                                     | `?opacity=0.8`             |
| `gradient`        | Show volumetric gradients on the floor                                                          | `false`            | `true`, `false`                                                                 | `?gradient=true`           |
| `minify`          | Enable SVG minification and payload optimization                                                | `true`             | `true`, `false`                                                                 | `?minify=false`            |

---

## ⚡ Grace Period Examples

```md
<!-- Strict mode — streak resets on any single missed day -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME&grace=0)

<!-- Default — one day grace period (current behavior) -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME&grace=1)

<!-- Lenient — forgives up to 2 consecutive missed days -->

![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME&grace=2)
```

---

## 🎨 Theme Presets

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
| `retro-terminal`   | Classic CRT terminal        | `000000` | `00ff41` | `00ff41` |
| `obsidian`         | Deep charcoal & amber gold  | `1a1a2e` | `f59e0b` | `e2e8f0` |
| `glacier`          | Icy sky blue & cyan         | `e0f2fe` | `06b6d4` | `0369a1` |
| `lumos`            | Void black & mint gold      | `0a0a0a` | `fbbf24` | `a7f3d0` |

> **`auto` uses CSS `@media (prefers-color-scheme)`** inside the SVG so the badge switches between the `light` and `dark` palettes based on the viewer's OS setting — no JavaScript required. This is ideal for GitHub profile READMEs where visitors may use either mode.

---

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

<!-- Space-age typography with Orbitron -->

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
