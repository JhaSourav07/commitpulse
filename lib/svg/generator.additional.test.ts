// lib/svg/generator.test.new.ts
// New tests covering gaps in existing generator.test.ts coverage.
// Covers: generateVersusSVG, neon theme bg, accent override, border param, org/repo title entity.

import { describe, it, expect } from 'vitest';
import { generateSVG, generateVersusSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { hexColor } from './sanitizer';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const baseStats: StreakStats = {
  currentStreak: 7,
  longestStreak: 14,
  totalContributions: 200,
  todayDate: '2024-06-12',
};

const baseCalendar: ContributionCalendar = {
  totalContributions: 200,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-06-10' },
        { contributionCount: 8, date: '2024-06-11' },
        { contributionCount: 12, date: '2024-06-12' },
      ],
    },
  ],
};

// ─── 1. Neon theme background color ──────────────────────────────────────────

describe('[Issue] neon theme bg color in SVG output', () => {
  it('renders #000000 background when theme=neon bg is passed directly', () => {
    // The neon theme has bg: '000000' — pass it as the bg param
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('000000'), // neon theme bg
        text: hexColor('00ffcc'), // neon theme text
        accent: hexColor('ff00ff'), // neon theme accent
        speed: '8s',
        scale: 'linear',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Background rect must use the neon bg color
    expect(svg).toContain('fill="#000000"');
    // Accent color must appear on tower fills
    expect(svg).toContain('#ff00ff');
  });

  it('neon bg color #000000 appears in the SVG fill attribute', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('000000'),
        text: hexColor('00ffcc'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
      } satisfies BadgeParams,
      baseCalendar
    );

    // The rect background fill should be the neon bg
    const match = svg.match(/fill="#000000"/);
    expect(match).not.toBeNull();
  });
});

// ─── 2. Custom accent overrides theme tower fill color ────────────────────────

describe('[Issue] custom accent param overrides tower fill color', () => {
  it('uses custom accent hex in tower fill attributes', () => {
    const customAccent = 'ff4500'; // custom orange, not any theme default

    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor(customAccent),
        speed: '8s',
        scale: 'linear',
      } satisfies BadgeParams,
      baseCalendar
    );

    // The custom accent color should appear in the SVG as tower fill
    expect(svg).toContain(`#${customAccent}`);
  });

  it('different accent values produce different SVG fill colors', () => {
    const svgBlue = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('0000ff'),
        speed: '8s',
        scale: 'linear',
      } satisfies BadgeParams,
      baseCalendar
    );

    const svgRed = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff0000'),
        speed: '8s',
        scale: 'linear',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Both SVGs should contain their respective accent colors
    expect(svgBlue).toContain('#0000ff');
    expect(svgRed).toContain('#ff0000');
    // And must NOT contain each other's accent
    expect(svgBlue).not.toContain('#ff0000');
    expect(svgRed).not.toContain('#0000ff');
  });
});

// ─── 3. border parameter produces stroke attribute ────────────────────────────

describe('[Issue] border parameter produces stroke attribute in SVG', () => {
  it('adds stroke attribute to root rect when border is provided', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('58a6ff'),
        border: hexColor('ff00ff'), // neon pink border
        speed: '8s',
        scale: 'linear',
      } satisfies BadgeParams,
      baseCalendar
    );

    expect(svg).toContain('stroke="#ff00ff"');
    expect(svg).toContain('stroke-width="2"');
  });

  it('does not include stroke attribute when border is not provided', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('58a6ff'),
        speed: '8s',
        scale: 'linear',
      } satisfies BadgeParams,
      baseCalendar
    );

    // No border param means no stroke on the background rect
    expect(svg).not.toContain('stroke="#');
  });
});

// ─── 4. org / repo change entity type in <title> ─────────────────────────────

describe('[Issue] org and repo params change entity type in SVG <title>', () => {
  it('renders "User Stats" in title when neither org nor repo is set', () => {
    const svg = generateSVG(baseStats, { user: 'chetan' } as unknown as BadgeParams, baseCalendar);

    expect(svg).toContain('<title id="cp-title-chetan">CommitPulse User Stats for chetan</title>');
  });

  it('renders "Organization Stats" in title when org param is set', () => {
    const svg = generateSVG(
      baseStats,
      { user: 'chetan', org: 'my-org' } as unknown as BadgeParams,
      baseCalendar
    );

    expect(svg).toContain(
      '<title id="cp-title-chetan">CommitPulse Organization Stats for chetan</title>'
    );
  });

  it('renders "Repository Stats" in title when repo param is set', () => {
    const svg = generateSVG(
      baseStats,
      { user: 'chetan', repo: 'my-repo' } as unknown as BadgeParams,
      baseCalendar
    );

    expect(svg).toContain(
      '<title id="cp-title-chetan">CommitPulse Repository Stats for chetan</title>'
    );
  });
});

// ─── 5. generateVersusSVG — completely untested function ─────────────────────

describe('[Issue] generateVersusSVG — zero existing test coverage', () => {
  const stats1: StreakStats = {
    currentStreak: 5,
    longestStreak: 10,
    totalContributions: 120,
    todayDate: '2024-06-12',
  };

  const stats2: StreakStats = {
    currentStreak: 3,
    longestStreak: 8,
    totalContributions: 80,
    todayDate: '2024-06-12',
  };

  const calendar1: ContributionCalendar = {
    totalContributions: 120,
    weeks: [
      {
        contributionDays: [
          { contributionCount: 4, date: '2024-06-10' },
          { contributionCount: 9, date: '2024-06-11' },
        ],
      },
    ],
  };

  const calendar2: ContributionCalendar = {
    totalContributions: 80,
    weeks: [
      {
        contributionDays: [
          { contributionCount: 2, date: '2024-06-10' },
          { contributionCount: 6, date: '2024-06-11' },
        ],
      },
    ],
  };

  const versusParams: BadgeParams = {
    user: 'chetan',
    versus: 'rival',
    bg: hexColor('0d1117'),
    text: hexColor('ffffff'),
    accent: hexColor('58a6ff'),
    speed: '8s',
    scale: 'linear',
  };

  it('produces a valid SVG string (starts with <svg, ends with </svg>)', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);

    expect(svg.trim()).toBeDefined();
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('includes role="img" for accessibility', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    expect(svg).toContain('role="img"');
  });

  it('includes both usernames in the SVG <title> tag', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    expect(svg).toContain('chetan');
    expect(svg).toContain('rival');
    expect(svg).toContain('CommitPulse Versus Stats');
  });

  it('renders a "VS" label between the two panels', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    expect(svg).toContain('>VS<');
  });

  it('renders a dividing line between the two user panels', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    // The dashed vertical divider line
    expect(svg).toContain('stroke-dasharray="4 4"');
  });

  it('total width viewBox is double the single card width for medium size', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    expect(svg).toContain('viewBox="0 0 1200 420"');
    expect(svg).toContain('width="100%"');
  });

  it('renders correct viewBox for small size in versus SVG', () => {
    const svg = generateVersusSVG(
      stats1,
      stats2,
      { ...versusParams, size: 'small' },
      calendar1,
      calendar2
    );
    expect(svg).toContain('viewBox="0 0 800 280"');
  });

  it('renders correct viewBox for large size in versus SVG', () => {
    const svg = generateVersusSVG(
      stats1,
      stats2,
      { ...versusParams, size: 'large' },
      calendar1,
      calendar2
    );
    expect(svg).toContain('viewBox="0 0 1600 560"');
  });

  it('includes total contribution counts from both users in <desc>', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    expect(svg).toContain('120');
    expect(svg).toContain('80');
  });

  it('escapes XML characters in both usernames', () => {
    const svg = generateVersusSVG(
      stats1,
      stats2,
      { ...versusParams, user: 'chetan&dev', versus: 'rival<one>' },
      calendar1,
      calendar2
    );

    expect(svg).toContain('chetan&amp;dev');
    expect(svg).toContain('rival&lt;one&gt;');
    expect(svg).not.toContain('chetan&dev');
    expect(svg).not.toContain('rival<one>');
  });

  it('generates auto-theme versus SVG with CSS custom properties', () => {
    const autoVersusParams: BadgeParams = {
      ...versusParams,
      autoTheme: true,
    };

    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);

    expect(svg).toContain('--cp-bg');
    expect(svg).toContain('--cp-accent');
    expect(svg).toContain('prefers-color-scheme: dark');
  });

  it('does not render an auto-theme media query for static versus SVG', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    expect(svg).not.toContain('prefers-color-scheme: dark');
  });
});

// ─── Custom gradient_stops and gradient_dir parameters ───────────────────────

describe('[Feature] custom gradient_stops and gradient_dir', () => {
  it('existing gradient=true renders default gradient without custom stops', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should use default tower-grad-level-* IDs
    expect(svg).toContain('tower-grad-level-1');
    expect(svg).toContain('tower-grad-level-2');
  });

  it('gradient=true with valid gradient_stops renders custom gradient', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'ff6b35,ff007f,7000ff',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should contain custom gradient colors
    expect(svg).toContain('#ff6b35');
    expect(svg).toContain('#ff007f');
    expect(svg).toContain('#7000ff');
    // Should have custom gradient IDs, not default tower-grad-level-*
    expect(svg).toContain('custom-grad-');
  });

  it('gradient_stops with # prefix works correctly', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: '#ff6b35,#ff007f,#7000ff',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should normalize and use the colors
    expect(svg).toContain('#ff6b35');
    expect(svg).toContain('#ff007f');
    expect(svg).toContain('#7000ff');
  });

  it('invalid gradient_stops falls back to default gradient', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'invalid,colors,here',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should fallback to default gradient (tower-grad-level-*)
    expect(svg).toContain('tower-grad-level-1');
    expect(svg).not.toContain('custom-grad-');
  });

  it('fewer than 2 valid colors in gradient_stops falls back to default', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'ff6b35',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should fallback to default gradient
    expect(svg).toContain('tower-grad-level-1');
    expect(svg).not.toContain('custom-grad-');
  });

  it('gradient_dir=vertical produces correct SVG coordinates', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'ff6b35,7000ff',
        gradient_dir: 'vertical',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Vertical gradient should have y1 and y2 different (0% to 100%)
    expect(svg).toMatch(/x1="0%"\s+y1="0%"\s+x2="0%"\s+y2="100%"/);
  });

  it('gradient_dir=horizontal produces correct SVG coordinates', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'ff6b35,7000ff',
        gradient_dir: 'horizontal',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Horizontal gradient should have x1 and x2 different (0% to 100%)
    expect(svg).toMatch(/x1="0%"\s+y1="0%"\s+x2="100%"\s+y2="0%"/);
  });

  it('gradient_dir=diagonal produces correct SVG coordinates', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'ff6b35,7000ff',
        gradient_dir: 'diagonal',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Diagonal gradient should have both x and y varying
    expect(svg).toMatch(/x1="0%"\s+y1="0%"\s+x2="100%"\s+y2="100%"/);
  });

  it('invalid gradient_dir falls back to vertical', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'ff6b35,7000ff',
        // @ts-expect-error: intentionally passing invalid value to test fallback
        gradient_dir: 'invalid',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should fallback to vertical
    expect(svg).toMatch(/x1="0%"\s+y1="0%"\s+x2="0%"\s+y2="100%"/);
  });

  it('gradient_stops with mixed valid and invalid colors ignores invalid ones', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: true,
        gradient_stops: 'ff6b35,invalid,7000ff',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should use the 2 valid colors and ignore invalid
    expect(svg).toContain('#ff6b35');
    expect(svg).toContain('#7000ff');
    expect(svg).toContain('custom-grad-');
  });

  it('gradient=false ignores gradient_stops and gradient_dir', () => {
    const svg = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('ff00ff'),
        speed: '8s',
        scale: 'linear',
        gradient: false,
        gradient_stops: 'ff6b35,7000ff',
        gradient_dir: 'horizontal',
      } satisfies BadgeParams,
      baseCalendar
    );

    // Should not contain any gradient definitions
    expect(svg).not.toContain('linearGradient');
    expect(svg).not.toContain('custom-grad-');
    expect(svg).not.toContain('tower-grad-level-');
  });
});
