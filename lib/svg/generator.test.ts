import { describe, it, expect } from 'vitest';
import {
  generateSVG,
  generateMonthlySVG,
  generateNotFoundSVG,
  particleCount,
  escapeXML,
} from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats, MonthlyStats } from '../../types';
import { hexColor } from './sanitizer';

describe('generateSVG', () => {
  const mockStats: StreakStats = {
    currentStreak: 5,
    longestStreak: 10,
    totalContributions: 100,
    todayDate: '2024-06-12',
  };
  const mockCalendar = {
    weeks: [
      {
        contributionDays: [
          { contributionCount: 0, date: '2024-06-10' },
          { contributionCount: 5, date: '2024-06-11' },
          { contributionCount: 15, date: '2024-06-12' }, // Triggers particle generation (>10)
        ],
      },
    ],
  } as ContributionCalendar;

  it('omits stats labels when hide_stats is true', () => {
    const svg = generateSVG(
      mockStats,
      {
        user: 'avi',
        bg: hexColor('0d1117'),
        text: hexColor('c9d1d9'),
        accent: hexColor('58a6ff'),
        speed: '8s',
        scale: 'linear',
        hide_stats: true,
      },
      mockCalendar
    );

    expect(svg).not.toContain('CURRENT_STREAK');
    expect(svg).not.toContain('ANNUAL_SYNC_TOTAL');
    expect(svg).not.toContain('PEAK_STREAK');
  });

  it('renders stats labels when hide_stats is false', () => {
    const svg = generateSVG(
      mockStats,
      {
        user: 'avi',
        bg: hexColor('0d1117'),
        text: hexColor('c9d1d9'),
        accent: hexColor('58a6ff'),
        speed: '8s',
        scale: 'linear',
        hide_stats: false,
      },
      mockCalendar
    );

    expect(svg).toContain('CURRENT_STREAK');
    expect(svg).toContain('ANNUAL_SYNC_TOTAL');
    expect(svg).toContain('PEAK_STREAK');
  });

  it('uses default typography when no font is passed', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);

    expect(svg).toContain('Syncopate');
    expect(svg).toContain('Space Grotesk');
  });

  it('applies custom font when font is provided', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'jetbrains' } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('JetBrains Mono');
  });

  it('handles radius=0 correctly', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', radius: 0 } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('rx="0"');
  });

  it('handles log scale parameter correctly', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', scale: 'log' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('svg');
  });

  it('uses transparent background when hideBackground is true', () => {
    const svg = generateSVG(
      mockStats,
      {
        user: 'avi',
        hideBackground: true,
      } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('fill="transparent"');
  });

  it('uses normal background when hideBackground is false or omitted', () => {
    const svg = generateSVG(
      mockStats,
      {
        user: 'avi',
        bg: '0d1117',
      } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).not.toContain('fill="transparent"');
  });

  it('generates particles for days with 10 or more contributions', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);
    expect(svg).toContain('class="heat-particles"');
  });

  it('supports dynamic Google Fonts for non-predefined fonts', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'Inter' } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain(
      "@import url('https://fonts.googleapis.com/css2?family=Inter&amp;display=swap');"
    );
    expect(svg).toContain('font-family: "Inter", sans-serif;');
  });

  it('replaces spaces with plus sign in dynamic Google Font URLs', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'Open Sans' } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('family=Open+Sans');
  });

  it('sanitizes dangerous characters in font names to prevent CSS injection', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'Inter"</style><script>alert(1)</script>' } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('family=Interstylescriptalert1script');
    expect(svg).not.toContain('alert(1)');
    expect(svg).not.toContain('<script>');
  });

  it('handles missing params with defaults', () => {
    const svg = generateSVG(mockStats, {} as unknown as BadgeParams, mockCalendar);
    expect(svg).toContain('0d1117'); // default bg
    expect(svg).toContain('00ffaa'); // default accent
    expect(svg).toContain('ffffff'); // default text
  });

  it('falls back to default typography for completely invalid font names', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: '!!!' } as unknown as BadgeParams,
      mockCalendar
    );
    // Should NOT contain a dynamic google fonts import for an empty/invalid family
    expect(svg).not.toContain('family=&amp;display=swap');
    // Should use default body font
    expect(svg).toContain('font-family: "Space Grotesk", sans-serif');
  });

  it('uses default font when font param is an empty string', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: '' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('Space Grotesk');
    expect(svg).not.toContain('family=&amp;display=swap');
  });

  it('uses default font when font param is whitespace only', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: '   ' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('Space Grotesk');
    expect(svg).not.toContain('family=+&amp;display=swap');
  });

  it('allows apostrophes in font names like Times New Roman', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', font: 'Gill Sans' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('Gill Sans');
  });

  it('emits tower-raising CSS animations and staggered delays', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);

    // Check for CSS keyframes and class
    expect(svg).toContain('.cp-tower');
    expect(svg).toContain('@keyframes grow-up');

    // Check for inline animation-delay style on the nested group
    expect(svg).toMatch(/style="animation-delay: \d+\.\d+s;"/);
  });

  it('escapes XML-reserved characters in tower tooltip titles', () => {
    const calendarWithUnsafeDate = {
      weeks: [
        {
          contributionDays: [{ contributionCount: 3, date: '2024-06-12 & <bad>' }],
        },
      ],
    } as ContributionCalendar;

    const svg = generateSVG(
      mockStats,
      { user: 'avi' } as unknown as BadgeParams,
      calendarWithUnsafeDate
    );

    expect(svg).toContain('<title>TODAY: 2024-06-12 &amp; &lt;bad&gt;: 3 contributions</title>');
    expect(svg).not.toContain('<title>TODAY: 2024-06-12 & <bad>: 3 contributions</title>');
  });

  // =========================================================================
  // ISSUE #1084 FIX: Verify reduced-motion CSS disables scan-line in static mode
  // =========================================================================
  it('verifies reduced-motion CSS disables scan-line in static mode', () => {
    // 1. Call static generateSVG (no autoTheme)
    const svg = generateSVG(
      mockStats,
      { user: 'avi', autoTheme: false } as unknown as BadgeParams,
      mockCalendar
    );

    // 2. 3 exact assertions as per the Definition of Done
    expect(svg).toContain('prefers-reduced-motion: reduce');
    expect(svg).toContain('.scan-line');
    expect(svg).toContain('animation: none !important');
  });

  it('uses English labels by default', () => {
    const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);
    expect(svg).toContain('CURRENT_STREAK');
  });

  it('uses Spanish labels when lang=es', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', lang: 'es' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('RACHA_ACTUAL');
  });

  it('falls back to English labels for unknown language', () => {
    const svg = generateSVG(
      mockStats,
      { user: 'avi', lang: 'unknown' } as unknown as BadgeParams,
      mockCalendar
    );
    expect(svg).toContain('CURRENT_STREAK');
  });

  // ── Auto-theme (prefers-color-scheme) tests ──────────────────────────────
  // These verify that theme=auto produces an SVG that switches between light
  // and dark color palettes using CSS custom properties and a media query,
  // without any JavaScript.

  describe('autoTheme', () => {
    const autoParams: BadgeParams = {
      user: 'avi',
      bg: hexColor('ffffff'),
      text: hexColor('24292f'),
      accent: hexColor('0969da'),
      speed: '8s',
      scale: 'linear',
      autoTheme: true,
    };

    it('injects CSS custom properties for light-mode defaults', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);

      // Light-mode CSS variables (the "default" palette)
      expect(svg).toContain('--cp-bg: #ffffff');
      expect(svg).toContain('--cp-text: #24292f');
      expect(svg).toContain('--cp-accent: #0969da');
    });

    it('injects @media (prefers-color-scheme: dark) with exact dark palette hex values', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);

      // Media query block must be present
      expect(svg).toContain('prefers-color-scheme: dark');

      // Check for exact hex values used in AUTO_DARK_THEME
      expect(svg).toContain('--cp-bg: #0d1117');
      expect(svg).toContain('--cp-text: #c9d1d9');
      expect(svg).toContain('--cp-accent: #58a6ff');
    });

    it('uses CSS utility classes instead of hardcoded fill attributes', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);

      // Background rect should use a class, not a hardcoded fill
      expect(svg).toContain('class="cp-bg-fill"');

      // Active towers should use the accent class
      expect(svg).toContain('class="cp-accent-fill"');

      // The radar scan line should also use the accent class and scan-line hook
      expect(svg).toContain('class="cp-accent-fill scan-line"');

      // cp-text-fill is emitted only in Ghost City mode (0 total contributions)
      const ghostCalendar: ContributionCalendar = {
        totalContributions: 0,
        weeks: [{ contributionDays: [{ contributionCount: 0, date: '2024-06-10' }] }],
      };
      const ghostSvg = generateSVG(mockStats, autoParams, ghostCalendar);
      expect(ghostSvg).toContain('class="cp-text-fill"');
    });

    it('references var() in CSS class definitions', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);

      expect(svg).toContain('fill: var(--cp-bg)');
      expect(svg).toContain('fill: var(--cp-text)');
      expect(svg).toContain('fill: var(--cp-accent)');
    });

    it('does NOT inject a media query for non-auto themes', () => {
      const staticParams: BadgeParams = {
        user: 'avi',
        bg: hexColor('0d1117'),
        text: hexColor('c9d1d9'),
        accent: hexColor('58a6ff'),
        speed: '8s',
        scale: 'linear',
        autoTheme: false,
      };

      const svg = generateSVG(mockStats, staticParams, mockCalendar);

      // Static themes must NOT contain the auto-theme machinery
      expect(svg).not.toContain('prefers-color-scheme: dark');
      expect(svg).not.toContain('--cp-bg');
      expect(svg).not.toContain('class="cp-bg-fill"');
    });

    it('includes desc element in auto-theme SVG output', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);
      expect(svg).toContain('<desc>');
      expect(svg).toContain(String(mockStats.totalContributions));
    });

    it('includes role="img" in auto-theme SVG output', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);
      expect(svg).toContain('role="img"');
    });

    it('generates heat particles with CSS class instead of inline fill', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);

      // Auto particles use the cp-accent-fill class instead of fill="<hex>"
      expect(svg).toContain('class="cp-accent-fill"');
      expect(svg).toContain('class="heat-particles"');
    });

    it('still respects prefers-reduced-motion for particles', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);
      expect(svg).toContain('prefers-reduced-motion');
    });

    it('includes the scan-line class on the radar rect in the static renderer output', () => {
      const staticParams = {
        user: 'avi',
        autoTheme: false,
      } as unknown as BadgeParams;

      const svg = generateSVG(mockStats, staticParams, mockCalendar);
      expect(svg).toContain('class="cp-accent-fill scan-line"');
    });

    it('includes the scan-line class on the radar rect in the auto-theme renderer output', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);
      expect(svg).toContain('class="cp-accent-fill scan-line"');
    });

    it('emits tower-raising CSS animations and staggered delays in auto mode', () => {
      const svg = generateSVG(mockStats, autoParams, mockCalendar);

      expect(svg).toContain('.cp-tower');
      expect(svg).toContain('@keyframes grow-up');
      expect(svg).toMatch(/style="animation-delay: \d+\.\d+s;"/);
    });

    it('escapes XML-reserved characters in auto-theme tower tooltip titles', () => {
      const calendarWithUnsafeDate = {
        weeks: [
          {
            contributionDays: [{ contributionCount: 3, date: '2024-06-12 & <bad>' }],
          },
        ],
      } as ContributionCalendar;

      const svg = generateSVG(mockStats, autoParams, calendarWithUnsafeDate);

      expect(svg).toContain('<title>TODAY: 2024-06-12 &amp; &lt;bad&gt;: 3 contributions</title>');
      expect(svg).not.toContain('<title>TODAY: 2024-06-12 & <bad>: 3 contributions</title>');
    });
  });

  // Ghost City Placeholder Mode tests
  describe('Ghost City Mode', () => {
    const emptyCalendar: ContributionCalendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 0, date: '2024-06-11' },
          ],
        },
      ],
    };

    const activeCalendar: ContributionCalendar = {
      totalContributions: 5,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 5, date: '2024-06-11' },
          ],
        },
      ],
    };

    it('renders Ghost City blueprint when user has 0 total contributions', () => {
      const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, emptyCalendar);

      // Should contain wireframe strokes
      expect(svg).toContain('stroke-width="0.5"');
      expect(svg).toContain('stroke-opacity="0.3"');
      // With GHOST_HEIGHT_PX=4, paths are drawn upward from ground (y=10):
      // Left face: M0 6 L0 10 L-16 0 L-16 -4 Z
      expect(svg).toContain('L0 10 L-16 0 L-16 -4 Z');
    });

    it('does not render Ghost City when user has active contributions', () => {
      const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, activeCalendar);

      // Should NOT contain wireframe strokes
      expect(svg).not.toContain('stroke-width="0.5"');
      expect(svg).not.toContain('stroke-opacity="0.3"');
      // Active mode empty days should have h=0 (10 + 0 = 10)
      expect(svg).toContain('L0 10 L-16 0 L-16 0 Z');
    });
  });

  describe('notFoundSVG', () => {
    it('includes reduced-motion CSS for the scan line and ghost pulse', () => {
      const svg = generateNotFoundSVG(
        'avi',
        hexColor('0d1117'),
        hexColor('00ffaa'),
        hexColor('ffffff'),
        8,
        '8s'
      );

      expect(svg).toContain('prefers-reduced-motion: reduce');
      expect(svg).toContain('.scan-line');
      expect(svg).toContain('animation: none !important');
      expect(svg).toContain('transition: none !important');
      expect(svg).toContain('class="scan-line"');
    });
  });

  // ── Timezone-aware pulse animation tests ─────────────────────────────────
  describe('todayDate pulse animation', () => {
    const calendar: ContributionCalendar = {
      totalContributions: 20,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 5, date: '2024-06-11' },
            { contributionCount: 5, date: '2024-06-12' }, // local "today" with commits
            { contributionCount: 0, date: '2024-06-13' }, // UTC last entry, no commits
          ],
        },
      ],
    };

    it('fires the pulse animation on the local today tower, not the last UTC entry', () => {
      // todayDate = '2024-06-12' (has commits) — pulse should appear
      // last entry = '2024-06-13' (no commits) — no pulse without timezone fix
      const stats: StreakStats = {
        currentStreak: 2,
        longestStreak: 2,
        totalContributions: 10,
        todayDate: '2024-06-12',
      };

      const svg = generateSVG(stats, { user: 'avi' } as unknown as BadgeParams, calendar);

      expect(svg).toContain('attributeName="opacity" values="1;0.4;1"');
    });

    it('does not pulse when todayDate has no commits even if another day does', () => {
      // todayDate = '2024-06-13' (0 commits) — no pulse
      const stats: StreakStats = {
        currentStreak: 0,
        longestStreak: 2,
        totalContributions: 10,
        todayDate: '2024-06-13',
      };

      const svg = generateSVG(stats, { user: 'avi' } as unknown as BadgeParams, calendar);

      expect(svg).not.toContain('attributeName="opacity" values="1;0.4;1"');
    });
    it('includes accessible title and description metadata', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'octocat' } as unknown as BadgeParams,
        mockCalendar
      );

      expect(svg).toContain('<title>CommitPulse User Stats for octocat</title>');
      expect(svg).toContain('<desc>');
      expect(svg).toContain('100');
      expect(svg).toContain('10');
    });
  });

  describe('tower top highlight', () => {
    it('renders white highlight on tower top when contributionCount > 5', () => {
      const calendarWithHighCount: ContributionCalendar = {
        totalContributions: 9,
        weeks: [
          {
            contributionDays: [
              { contributionCount: 6, date: '2024-06-10' },
              { contributionCount: 3, date: '2024-06-11' },
            ],
          },
        ],
      };

      const svg = generateSVG(
        mockStats,
        { user: 'avi' } as unknown as BadgeParams,
        calendarWithHighCount
      );

      expect(svg).toContain('fill="white" fill-opacity="0.2"');
    });

    it('does not render white highlight when all days have contributionCount <= 5', () => {
      const calendarWithLowCount: ContributionCalendar = {
        totalContributions: 8,
        weeks: [
          {
            contributionDays: [
              { contributionCount: 3, date: '2024-06-10' },
              { contributionCount: 5, date: '2024-06-11' },
            ],
          },
        ],
      };

      const svg = generateSVG(
        mockStats,
        { user: 'avi' } as unknown as BadgeParams,
        calendarWithLowCount
      );

      expect(svg).not.toContain('fill="white" fill-opacity="0.2"');
    });
  });

  describe('hide_title parameter', () => {
    it('omits the username title text when hide_title is true', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'octocat', hide_title: true } as unknown as BadgeParams,
        mockCalendar
      );

      expect(svg).not.toContain('OCTOCAT');
    });

    it('renders the username title text when hide_title is false', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'octocat', hide_title: false } as unknown as BadgeParams,
        mockCalendar
      );

      expect(svg).toContain('OCTOCAT');
    });
  });

  describe('SVG dimensions per size', () => {
    it('renders width="600" and height="420" for medium size (default)', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'avi', size: 'medium' } as unknown as BadgeParams,
        mockCalendar
      );

      expect(svg).toContain('width="600"');
      expect(svg).toContain('height="420"');
    });

    it('renders width="400" and height="280" for small size', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'avi', size: 'small' } as unknown as BadgeParams,
        mockCalendar
      );

      expect(svg).toContain('width="400"');
      expect(svg).toContain('height="280"');
    });

    it('renders width="800" and height="560" for large size', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'avi', size: 'large' } as unknown as BadgeParams,
        mockCalendar
      );

      expect(svg).toContain('width="800"');
      expect(svg).toContain('height="560"');
    });
  });

  describe('isometric labels', () => {
    it('does not render labels when labels parameter is absent', () => {
      const svg = generateSVG(mockStats, { user: 'avi' } as unknown as BadgeParams, mockCalendar);
      expect(svg).not.toContain('class="isometric-labels"');
    });

    it('does not render labels when labels parameter is false', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'avi', labels: false } as unknown as BadgeParams,
        mockCalendar
      );
      expect(svg).not.toContain('class="isometric-labels"');
    });

    it('renders month and weekday labels when labels=true', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'avi', labels: true } as unknown as BadgeParams,
        mockCalendar
      );
      expect(svg).toContain('class="isometric-labels"');
      expect(svg).toContain('Jun'); // June is first date in calendar '2024-06-10'
      expect(svg).toContain('Mon');
      expect(svg).toContain('Wed');
      expect(svg).toContain('Fri');
    });

    it('applies custom labelColor when provided', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'avi', labels: true, labelColor: 'ff00aa' } as unknown as BadgeParams,
        mockCalendar
      );
      expect(svg).toContain('fill="#ff00aa"');
    });

    it('renders labels in auto-theme mode', () => {
      const svg = generateSVG(
        mockStats,
        { user: 'avi', labels: true, autoTheme: true } as unknown as BadgeParams,
        mockCalendar
      );
      expect(svg).toContain('class="isometric-labels"');
      expect(svg).toContain('fill="var(--cp-text)"');
    });
  });
});

describe('generateMonthlySVG', () => {
  const mockMonthlyStats: MonthlyStats = {
    currentMonthTotal: 42,
    previousMonthTotal: 30,
    deltaPercentage: 40,
    deltaAbsolute: 12,
    currentMonthName: 'June',
  };

  it('renders monthly stats correctly with absolute delta', () => {
    const svg = generateMonthlySVG(mockMonthlyStats, {
      user: 'octocat',
      delta_format: 'absolute',
    } as unknown as BadgeParams);
    expect(svg).toContain('JUNE');
    expect(svg).toContain('42');
    expect(svg).toContain('+12 commits');
  });

  it('renders monthly stats correctly with percentage delta', () => {
    const svg = generateMonthlySVG(mockMonthlyStats, {
      user: 'octocat',
      delta_format: 'percent',
    } as unknown as BadgeParams);
    expect(svg).toContain('+40%');
  });

  it('renders monthly stats correctly with both delta formats', () => {
    const svg = generateMonthlySVG(mockMonthlyStats, {
      user: 'octocat',
      delta_format: 'both',
    } as unknown as BadgeParams);
    expect(svg).toContain('+40% (+12)');
  });

  it('respects custom width and height parameters', () => {
    const svg = generateMonthlySVG(mockMonthlyStats, {
      user: 'octocat',
      width: 400,
      height: 200,
    } as unknown as BadgeParams);
    expect(svg).toContain('width="400"');
    expect(svg).toContain('height="200"');
  });

  it('includes prefers-reduced-motion media query in static monthly SVG output', () => {
    const svg = generateMonthlySVG(mockMonthlyStats, {
      user: 'octocat',
    } as unknown as BadgeParams);

    expect(svg).toContain('prefers-reduced-motion: reduce');
    expect(svg).toContain('animation: none !important');
    expect(svg).toContain('transition: none !important');
  });

  it('includes prefers-reduced-motion media query in auto-theme monthly SVG output', () => {
    const svg = generateMonthlySVG(mockMonthlyStats, {
      user: 'octocat',
      autoTheme: true,
    } as unknown as BadgeParams);

    expect(svg).toContain('prefers-reduced-motion: reduce');
    expect(svg).toContain('animation: none !important');
    expect(svg).toContain('transition: none !important');
  });
});

describe('escapeXML', () => {
  it('escapes ampersands (&)', () => {
    expect(escapeXML('foo & bar')).toBe('foo &amp; bar');
  });

  it('escapes less-than signs (<)', () => {
    expect(escapeXML('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes greater-than signs (>)', () => {
    expect(escapeXML('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes (")', () => {
    expect(escapeXML('class="btn"')).toBe('class=&quot;btn&quot;');
  });

  it("escapes single quotes (')", () => {
    expect(escapeXML("it's working")).toBe('it&#39;s working');
  });

  it('escapes a string combining all five special characters', () => {
    const combined = `<element attr="val" data-quote='yes'>&</element>`;
    const expected = `&lt;element attr=&quot;val&quot; data-quote=&#39;yes&#39;&gt;&amp;&lt;/element&gt;`;
    expect(escapeXML(combined)).toBe(expected);
  });

  it('leaves a safe string unchanged', () => {
    const safe = 'Hello World 123!@#%^*()_+-=[]{}|;:,./?`~';
    expect(escapeXML(safe)).toBe(safe);
  });
});

describe('particleCount', () => {
  it('returns 0 when count is 0', () => {
    expect(particleCount(0)).toBe(0);
  });

  it('clamps to lower bound of 3 for low counts (e.g., 10 -> 3)', () => {
    expect(particleCount(10)).toBe(3);
  });

  it('scales correctly between bounds (e.g., 16 -> 4)', () => {
    expect(particleCount(16)).toBe(4);
  });

  it('clamps to upper bound of 5 for high counts (e.g., 20 -> 5, 100 -> 5)', () => {
    expect(particleCount(20)).toBe(5);
    expect(particleCount(100)).toBe(5);
  });
});
