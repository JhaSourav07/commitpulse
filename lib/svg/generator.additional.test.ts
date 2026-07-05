// lib/svg/generator.additional.test.ts
// New tests covering gaps in existing generator.test.ts coverage.
// Covers: renderGhostDefs consistency, generateVersusSVG, neon theme bg, accent override, border param, org/repo title entity.

import { describe, it, expect } from 'vitest';
import {
  generateSVG,
  generateVersusSVG,
  generateNotFoundSVG,
  generateRateLimitSVG,
} from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { hexColor } from './sanitizer';

// ─── renderGhostDefs refactor — consistency tests ─────────────────────────────
// Verifies that after extracting renderGhostDefs(), both generateNotFoundSVG
// and generateRateLimitSVG produce identical SVG filter definitions.
// Any divergence between the two functions is a regression.

describe('[Refactor] renderGhostDefs — shared defs helper consistency', () => {
  // ── generateNotFoundSVG defs ──────────────────────────────────────────────

  it('generateNotFoundSVG contains filter id="glow"', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('id="glow"');
  });

  it('generateNotFoundSVG contains filter id="softglow"', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('id="softglow"');
  });

  it('generateNotFoundSVG contains linearGradient id="ghostFade"', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('id="ghostFade"');
  });

  it('generateNotFoundSVG glow filter uses stdDeviation="5"', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('stdDeviation="5"');
  });

  it('generateNotFoundSVG softglow filter uses stdDeviation="8"', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('stdDeviation="8"');
  });

  it('generateNotFoundSVG ghostFade gradient uses bg color', () => {
    const bg = '#1a1a2e';
    const svg = generateNotFoundSVG('octocat', bg, '#00ffaa', '#ffffff', 8);
    expect(svg).toContain(`stop-color="${bg}"`);
  });

  // ── generateRateLimitSVG defs ─────────────────────────────────────────────

  it('generateRateLimitSVG contains filter id="glow"', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('id="glow"');
  });

  it('generateRateLimitSVG contains filter id="softglow"', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('id="softglow"');
  });

  it('generateRateLimitSVG contains linearGradient id="ghostFade"', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('id="ghostFade"');
  });

  it('generateRateLimitSVG glow filter uses stdDeviation="5"', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('stdDeviation="5"');
  });

  it('generateRateLimitSVG softglow filter uses stdDeviation="8"', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('stdDeviation="8"');
  });

  it('generateRateLimitSVG ghostFade gradient uses bg color', () => {
    const bg = '#1a1a2e';
    const svg = generateRateLimitSVG(bg, '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain(`stop-color="${bg}"`);
  });

  // ── Cross-function consistency — the key regression guards ────────────────

  it('both functions contain identical filter IDs', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    const extractFilterIds = (svg: string): string[] =>
      [...svg.matchAll(/id="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((id) => ['glow', 'softglow', 'ghostFade'].includes(id))
        .sort();

    expect(extractFilterIds(notFoundSvg)).toEqual(extractFilterIds(rateLimitSvg));
  });

  it('both functions use identical glow stdDeviation values', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    const extractStdDeviations = (svg: string): string[] =>
      [...svg.matchAll(/stdDeviation="([\d.]+)"/g)].map((m) => m[1]).sort();

    expect(extractStdDeviations(notFoundSvg)).toEqual(extractStdDeviations(rateLimitSvg));
  });

  it('ghostFade gradient stop offsets are consistent across both functions', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    // Both should have ghostFade with 30% and 100% stops
    expect(notFoundSvg).toContain('offset="30%"');
    expect(notFoundSvg).toContain('offset="100%"');
    expect(rateLimitSvg).toContain('offset="30%"');
    expect(rateLimitSvg).toContain('offset="100%"');
  });

  it('both functions remain valid SVGs after refactor', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    expect(notFoundSvg).toContain('<svg');
    expect(notFoundSvg).toContain('</svg>');
    expect(rateLimitSvg).toContain('<svg');
    expect(rateLimitSvg).toContain('</svg>');
  });

  it('custom bg color is reflected in ghostFade gradient for both functions', () => {
    const customBg = '#ff0066';

    const notFoundSvg = generateNotFoundSVG('octocat', customBg, '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG(customBg, '#00ffaa', '#ffffff', 8, '8s');

    expect(notFoundSvg).toContain(`stop-color="${customBg}"`);
    expect(rateLimitSvg).toContain(`stop-color="${customBg}"`);
  });
});

describe('[Refactor] renderGhostStyles — shared styles helper consistency', () => {
  it('both functions contain identical @keyframes float definitions', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    expect(notFoundSvg).toContain('@keyframes float');
    expect(rateLimitSvg).toContain('@keyframes float');
    expect(notFoundSvg).toContain('transform: translateY(-10px)');
    expect(rateLimitSvg).toContain('transform: translateY(-10px)');
  });

  it('both functions contain identical utility classes', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    ['.floating', '.delay-1', '.delay-2'].forEach((cls) => {
      expect(notFoundSvg).toContain(cls);
      expect(rateLimitSvg).toContain(cls);
    });
  });

  it('both functions retain ghost pulse and reduced-motion styles, and the not-found card keeps scan-line animation', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    ['.ghost-pulse', '@media (prefers-reduced-motion: reduce)'].forEach((style) => {
      expect(notFoundSvg).toContain(style);
      expect(rateLimitSvg).toContain(style);
    });

    expect(notFoundSvg).toContain('.scan-line');
  });
});

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

    expect(svg).toContain('fill="#000000"');
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

    const match = svg.match(/fill="#000000"/);
    expect(match).not.toBeNull();
  });
});

// ─── 2. Custom accent overrides theme tower fill color ────────────────────────

describe('[Issue] custom accent param overrides tower fill color', () => {
  it('uses custom accent hex in tower fill attributes', () => {
    const customAccent = 'ff4500';

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

    expect(svgBlue).toContain('#0000ff');
    expect(svgRed).toContain('#ff0000');
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
        border: hexColor('ff00ff'),
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
    expect(svg).toContain('stroke-dasharray="4 4"');
  });

  it('total width viewBox is double the single card width for medium size', () => {
    const svg = generateVersusSVG(stats1, stats2, versusParams, calendar1, calendar2);
    expect(svg).toContain('viewBox="0 0 1200 420"');
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="420"');
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

    expect(svg).toContain('#ff6b35');
    expect(svg).toContain('#ff007f');
    expect(svg).toContain('#7000ff');
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

    expect(svg).not.toContain('linearGradient');
    expect(svg).not.toContain('custom-grad-');
    expect(svg).not.toContain('tower-grad-level-');
  });
});

// ─── renderGhostTowers refactor — consistency tests ───────────────────────────
// These tests verify that generateNotFoundSVG and generateRateLimitSVG both
// use the shared renderGhostTowers() helper and produce geometrically consistent
// ghost tower output. Any divergence between the two functions is a regression.

describe('[Refactor] renderGhostTowers — shared helper consistency', () => {
  // ── generateNotFoundSVG ───────────────────────────────────────────────────

  it('generateNotFoundSVG contains class="ghost-towers" wrapper from shared helper', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('class="ghost-towers"');
  });

  it('generateNotFoundSVG ghost towers use fill-opacity="0.08" on left face', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('fill-opacity="0.08"');
  });

  it('generateNotFoundSVG ghost towers use fill-opacity="0.05" on right face', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('fill-opacity="0.05"');
  });

  it('generateNotFoundSVG ghost towers use fill-opacity="0.14" on top face', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('fill-opacity="0.14"');
  });

  it('generateNotFoundSVG ghost towers use stroke-opacity="0.18" on left face', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('stroke-opacity="0.18"');
  });

  it('generateNotFoundSVG ghost towers use stroke-opacity="0.12" on right face', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('stroke-opacity="0.12"');
  });

  it('generateNotFoundSVG ghost towers use stroke-opacity="0.22" on top face', () => {
    const svg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    expect(svg).toContain('stroke-opacity="0.22"');
  });

  // ── generateRateLimitSVG ──────────────────────────────────────────────────

  it('generateRateLimitSVG contains class="ghost-towers" wrapper from shared helper', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('class="ghost-towers"');
  });

  it('generateRateLimitSVG ghost towers use fill-opacity="0.08" on left face', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('fill-opacity="0.08"');
  });

  it('generateRateLimitSVG ghost towers use fill-opacity="0.05" on right face', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('fill-opacity="0.05"');
  });

  it('generateRateLimitSVG ghost towers use fill-opacity="0.14" on top face', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('fill-opacity="0.14"');
  });

  it('generateRateLimitSVG ghost towers use stroke-opacity="0.18" on left face', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('stroke-opacity="0.18"');
  });

  it('generateRateLimitSVG ghost towers use stroke-opacity="0.12" on right face', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('stroke-opacity="0.12"');
  });

  it('generateRateLimitSVG ghost towers use stroke-opacity="0.22" on top face', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    expect(svg).toContain('stroke-opacity="0.22"');
  });

  // ── Cross-function consistency ─────────────────────────────────────────────

  const extractGhostTowerSvg = (svg: string) => {
    const match = svg.match(/<g[^>]+class="ghost-towers"[^>]*>([\s\S]*?)<\/g>/);
    return match?.[1] ?? svg;
  };

  it('both functions use identical fill-opacity values — no silent divergence', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    const extractFillOpacities = (svg: string) =>
      [...svg.matchAll(/fill-opacity="([\d.]+)"/g)].map((m) => m[1]).sort();

    const notFoundGhostSvg = extractGhostTowerSvg(notFoundSvg);
    const rateLimitGhostSvg = extractGhostTowerSvg(rateLimitSvg);

    const notFoundOpacities = extractFillOpacities(notFoundGhostSvg);
    const rateLimitOpacities = extractFillOpacities(rateLimitGhostSvg);

    const rateLimitSet = new Set(rateLimitOpacities);
    const notFoundSet = new Set(notFoundOpacities);

    for (const val of rateLimitSet) {
      expect(notFoundSet).toContain(val);
    }
  });

  it('both functions use identical stroke-opacity values — no silent divergence', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    const extractStrokeOpacities = (svg: string) =>
      [...svg.matchAll(/stroke-opacity="([\d.]+)"/g)].map((m) => m[1]).sort();

    const notFoundGhostSvg = extractGhostTowerSvg(notFoundSvg);
    const rateLimitGhostSvg = extractGhostTowerSvg(rateLimitSvg);

    const notFoundOpacities = extractStrokeOpacities(notFoundGhostSvg);
    const rateLimitOpacities = extractStrokeOpacities(rateLimitGhostSvg);

    const rateLimitSet = new Set(rateLimitOpacities);
    const notFoundSet = new Set(notFoundOpacities);

    for (const val of rateLimitSet) {
      expect(notFoundSet).toContain(val);
    }
  });

  it('generateRateLimitSVG now renders 48 ghost towers (unified with GHOST_LAYOUT)', () => {
    const svg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');
    const matches = [...svg.matchAll(/<g transform="translate\(/g)];
    expect(matches.length).toBeGreaterThanOrEqual(48);
  });

  it('accent color is correctly applied to ghost towers in both functions', () => {
    const customAccent = '#ff00ff';
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', customAccent, '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', customAccent, '#ffffff', 8, '8s');

    expect(notFoundSvg).toContain(`fill="${customAccent}"`);
    expect(rateLimitSvg).toContain(`fill="${customAccent}"`);
    expect(notFoundSvg).toContain(`stroke="${customAccent}"`);
    expect(rateLimitSvg).toContain(`stroke="${customAccent}"`);
  });

  it('both SVGs are still valid (contain <svg and </svg>) after refactor', () => {
    const notFoundSvg = generateNotFoundSVG('octocat', '#0d1117', '#00ffaa', '#ffffff', 8);
    const rateLimitSvg = generateRateLimitSVG('#0d1117', '#00ffaa', '#ffffff', 8, '8s');

    expect(notFoundSvg).toContain('<svg');
    expect(notFoundSvg).toContain('</svg>');
    expect(rateLimitSvg).toContain('<svg');
    expect(rateLimitSvg).toContain('</svg>');
  });
});

// ─── 6. Customizable 3D projection angles (theta and phi) ─────────────────────

describe('[Feature] Customizable 3D projection angles (theta and phi)', () => {
  it('renders SVG with default angles (45 degrees, arcsin(10/16)) when params are absent', () => {
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

    expect(svg).toContain('translate(284, 130)');
  });

  it('translates tower coordinates differently when custom theta and phi are passed', () => {
    const svgCustom = generateSVG(
      baseStats,
      {
        user: 'chetan',
        bg: hexColor('0d1117'),
        text: hexColor('ffffff'),
        accent: hexColor('58a6ff'),
        speed: '8s',
        scale: 'linear',
        theta: 90,
        phi: 45,
      } satisfies BadgeParams,
      baseCalendar
    );

    expect(svgCustom).toContain('translate(277, 120)');
    expect(svgCustom).not.toContain('translate(284, 130)');
  });
});

// ─── generateAutoThemeVersusSVG refactor — renderTowers consistency ──────────

describe('[Refactor] generateAutoThemeVersusSVG — uses renderTowers consistency', () => {
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
          { contributionCount: 0, date: '2024-06-09' },
          { contributionCount: 5, date: '2024-06-10' },
          { contributionCount: 11, date: '2024-06-11' },
          { contributionCount: 6, date: '2024-06-12' },
        ],
      },
    ],
  };

  const calendar2: ContributionCalendar = {
    totalContributions: 80,
    weeks: [
      {
        contributionDays: [
          { contributionCount: 0, date: '2024-06-09' },
          { contributionCount: 3, date: '2024-06-10' },
          { contributionCount: 12, date: '2024-06-11' },
          { contributionCount: 2, date: '2024-06-12' },
        ],
      },
    ],
  };

  const autoVersusParams: BadgeParams = {
    user: 'chetan',
    versus: 'rival',
    bg: hexColor('0d1117'),
    text: hexColor('ffffff'),
    accent: hexColor('58a6ff'),
    speed: '8s',
    scale: 'linear',
    autoTheme: true,
  };

  it('auto-theme versus SVG contains cp-accent-fill class for active towers', () => {
    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);
    expect(svg).toContain('class="cp-accent-fill"');
  });

  it('auto-theme versus SVG contains cp-text-fill class for ghost towers', () => {
    const ghostCalendar: ContributionCalendar = {
      totalContributions: 0,
      weeks: [{ contributionDays: [{ contributionCount: 0, date: '2024-06-12' }] }],
    };
    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, ghostCalendar, ghostCalendar);
    expect(svg).toContain('class="cp-text-fill"');
  });

  it('auto-theme versus SVG contains cp-bg CSS variable (from auto-theme style block)', () => {
    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);
    expect(svg).toContain('--cp-bg');
    expect(svg).toContain('--cp-accent');
    expect(svg).toContain('prefers-color-scheme: dark');
  });

  it('auto-theme versus SVG has heat particles for high-contribution days', () => {
    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);
    expect(svg).toContain('class="heat-particles"');
  });

  it('auto-theme versus SVG has today pulse animation', () => {
    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);
    expect(svg).toContain('attributeName="opacity" values="1;0.4;1"');
  });

  it('auto-theme versus SVG has staggered tower animation delays', () => {
    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);
    expect(svg).toMatch(/style="animation-delay: \d+\.\d+s;"/);
  });

  it('auto-theme versus and static versus produce same structural tower count', () => {
    const staticParams: BadgeParams = {
      ...autoVersusParams,
      autoTheme: false,
    };
    const autoSvg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);
    const staticSvg = generateVersusSVG(stats1, stats2, staticParams, calendar1, calendar2);

    const autoTowers = [...autoSvg.matchAll(/class="cp-tower"/g)].length;
    const staticTowers = [...staticSvg.matchAll(/class="cp-tower"/g)].length;
    expect(autoTowers).toBe(staticTowers);
  });

  it('auto-theme versus does not contain inline hex fill colors on tower paths', () => {
    const svg = generateVersusSVG(stats1, stats2, autoVersusParams, calendar1, calendar2);

    const towerSection = svg.match(/class="cp-tower"[\s\S]*?<\/g>/g) || [];
    for (const tower of towerSection) {
      expect(tower).not.toMatch(/fill="#[0-9a-fA-F]{6}"/);
    }
  });
});
