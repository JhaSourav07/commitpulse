// @vitest-environment node
import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

import {
  generateSVG,
  generateMonthlySVG,
  generateMonthlyBadge,
  generateWrappedSVG,
  generateHeatmapSVG,
  generateNotFoundSVG,
  generateVersusSVG,
  generatePulseSVG,
  generateSkylineSVG,
  generateAutoThemeSkylineSVG,
  generateRateLimitSVG,
  generateLanguagesSVG,
  generateActivityGraphSVG,
} from '@/lib/svg/generator';
import { generateRadarSVG } from '@/lib/svg/radar';
import { generateRepoSpotlightSVG } from '@/lib/svg/repoSpotlight';
import { generateWeekdaySVG } from '@/lib/svg/weekday';
import { generateCommitClockSVG } from '@/lib/svg/commitClock';
import { generateConstellationSVG } from '@/lib/svg/constellation';
import { generateDoughnutSVG } from '@/lib/svg/doughnut';
import { hexColor } from '@/lib/svg/sanitizer';
import type {
  ContributionCalendar,
  StreakStats,
  MonthlyStats,
  BadgeParams,
  RepoContribution,
} from '@/types';
import type { WrappedStats } from '@/types/dashboard';
import type { GitHubRepo } from '@/lib/github';

const BASELINES_DIR = path.resolve(__dirname, 'baselines');
const DIFFS_DIR = path.resolve(__dirname, 'diffs');

function compareOrUpdateVisualBaseline(testName: string, svgContent: string) {
  // Convert SVG string to PNG using resvg-js
  const resvg = new Resvg(svgContent, {
    font: {
      loadSystemFonts: false, // Ensures absolute cross-platform consistency by relying only on embedded fonts
    },
    fitTo: {
      mode: 'original',
    },
  });
  const pngBuffer = resvg.render().asPng();

  const baselinePath = path.join(BASELINES_DIR, `${testName}.png`);
  const actualPath = path.join(DIFFS_DIR, `${testName}-actual.png`);
  const diffPath = path.join(DIFFS_DIR, `${testName}-diff.png`);

  const updateBaselines = process.env.UPDATE_VISUAL_BASELINES === 'true';

  if (!fs.existsSync(BASELINES_DIR)) {
    fs.mkdirSync(BASELINES_DIR, { recursive: true });
  }

  // Create baseline if missing or requested
  if (updateBaselines || !fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, pngBuffer);
    return;
  }

  // Compare actual rendering to baseline reference
  const baselineData = fs.readFileSync(baselinePath);
  const baselinePng = PNG.sync.read(baselineData);
  const actualPng = PNG.sync.read(pngBuffer);

  const { width, height } = baselinePng;

  if (actualPng.width !== width || actualPng.height !== height) {
    if (!fs.existsSync(DIFFS_DIR)) {
      fs.mkdirSync(DIFFS_DIR, { recursive: true });
    }
    fs.writeFileSync(actualPath, pngBuffer);
    throw new Error(
      `Dimension mismatch for visual test "${testName}": expected ${width}x${height}, got ${actualPng.width}x${actualPng.height}.`
    );
  }

  const diffPng = new PNG({ width, height });
  const diffPixels = pixelmatch(baselinePng.data, actualPng.data, diffPng.data, width, height, {
    threshold: 0.1,
  });

  if (diffPixels > 0) {
    if (!fs.existsSync(DIFFS_DIR)) {
      fs.mkdirSync(DIFFS_DIR, { recursive: true });
    }
    fs.writeFileSync(actualPath, pngBuffer);
    fs.writeFileSync(diffPath, PNG.sync.write(diffPng));
    throw new Error(
      `Visual regression detected for "${testName}": ${diffPixels} pixels differ from the baseline.`
    );
  }
}

// ─── Shared Mock Fixtures ──────────────────────────────────────────────────

const mockStats: StreakStats = {
  currentStreak: 5,
  longestStreak: 10,
  totalContributions: 150,
  todayDate: '2024-06-12',
};

const mockCalendar: ContributionCalendar = {
  totalContributions: 150,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 0, date: '2024-01-01' },
        { contributionCount: 5, date: '2024-01-02' },
        { contributionCount: 15, date: '2024-01-03' },
        { contributionCount: 20, date: '2024-01-04' },
        { contributionCount: 2, date: '2024-01-05' },
        { contributionCount: 8, date: '2024-01-06' },
        { contributionCount: 0, date: '2024-01-07' },
      ],
    },
    {
      contributionDays: [
        { contributionCount: 4, date: '2024-01-08' },
        { contributionCount: 12, date: '2024-01-09' },
        { contributionCount: 1, date: '2024-01-10' },
        { contributionCount: 10, date: '2024-01-11' },
        { contributionCount: 0, date: '2024-01-12' },
        { contributionCount: 3, date: '2024-01-13' },
        { contributionCount: 7, date: '2024-01-14' },
      ],
    },
  ],
};

const mockMonthlyStats: MonthlyStats = {
  currentMonthTotal: 42,
  previousMonthTotal: 30,
  deltaPercentage: 40,
  deltaAbsolute: 12,
  currentMonthName: 'June',
};

const mockParams: BadgeParams = {
  user: 'octocat',
  bg: hexColor('0d1117'),
  text: hexColor('c9d1d9'),
  accent: hexColor('58a6ff'),
  speed: '8s',
  scale: 'linear',
  font: 'jetbrains', // predefined font to ensure same character rendering across environments
};

const mockWrappedStats: WrappedStats = {
  totalContributions: 542,
  mostActiveDate: '2024-11-23',
  highestDailyCount: 35,
  busiestMonth: 'November',
  weekendRatio: 0.18,
  topLanguage: 'TypeScript',
  calendar: mockCalendar,
};

const mockRepoDetails: GitHubRepo = {
  name: 'commitpulse',
  stargazers_count: 73,
  language: 'TypeScript',
  forks_count: 8,
  description: 'An elegant dashboard highlighting your daily contribution flow.',
  owner: { login: 'sureshsuriya' },
};

const mockRepoContributions: RepoContribution[] = [
  {
    repository: {
      name: 'commitpulse',
      primaryLanguage: { name: 'TypeScript' },
    },
    contributions: { totalCount: 140 },
  },
  {
    repository: {
      name: 'react',
      primaryLanguage: { name: 'JavaScript' },
    },
    contributions: { totalCount: 10 },
  },
];

const mockHourCounts: number[] = [
  0, 0, 0, 0, 0, 0, 2, 5, 12, 20, 15, 8, 4, 1, 0, 0, 0, 0, 2, 8, 14, 6, 1, 0,
];

// ─── Visual Test Cases ──────────────────────────────────────────────────────

describe('Visual Regression Tests - SVG Generators', () => {
  it('1. generateSVG (Default theme)', () => {
    const svg = generateSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateSVG-default', svg);
  });

  it('2. generateSVG (Auto-Theme enabled)', () => {
    const svg = generateSVG(mockStats, { ...mockParams, autoTheme: true }, mockCalendar);
    compareOrUpdateVisualBaseline('generateSVG-autotheme', svg);
  });

  it('3. generateMonthlySVG', () => {
    const svg = generateMonthlySVG(mockMonthlyStats, mockParams);
    compareOrUpdateVisualBaseline('generateMonthlySVG', svg);
  });

  it('4. generateMonthlyBadge', () => {
    const svg = generateMonthlyBadge(mockMonthlyStats, mockParams);
    compareOrUpdateVisualBaseline('generateMonthlyBadge', svg);
  });

  it('5. generateWrappedSVG', () => {
    const svg = generateWrappedSVG(mockWrappedStats, mockParams, '2024', mockCalendar);
    compareOrUpdateVisualBaseline('generateWrappedSVG', svg);
  });

  it('6. generateHeatmapSVG', () => {
    const svg = generateHeatmapSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateHeatmapSVG', svg);
  });

  it('7. generateNotFoundSVG', () => {
    const svg = generateNotFoundSVG('octocat', '0d1117', '58a6ff', 'c9d1d9', 8, '8s');
    compareOrUpdateVisualBaseline('generateNotFoundSVG', svg);
  });

  it('8. generateVersusSVG', () => {
    const svg = generateVersusSVG(
      mockStats,
      { ...mockStats, totalContributions: 80, currentStreak: 3 },
      mockParams,
      mockCalendar,
      {
        ...mockCalendar,
        totalContributions: 80,
      }
    );
    compareOrUpdateVisualBaseline('generateVersusSVG', svg);
  });

  it('9. generatePulseSVG', () => {
    const svg = generatePulseSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generatePulseSVG', svg);
  });

  it('10. generateSkylineSVG', () => {
    const svg = generateSkylineSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateSkylineSVG', svg);
  });

  it('11. generateAutoThemeSkylineSVG', () => {
    const svg = generateAutoThemeSkylineSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateAutoThemeSkylineSVG', svg);
  });

  it('12. generateRateLimitSVG', () => {
    const svg = generateRateLimitSVG('0d1117', '58a6ff', 'c9d1d9', 8, '8s', false);
    compareOrUpdateVisualBaseline('generateRateLimitSVG', svg);
  });

  it('13. generateLanguagesSVG', () => {
    const svg = generateLanguagesSVG(mockStats, mockParams, mockRepoContributions);
    compareOrUpdateVisualBaseline('generateLanguagesSVG', svg);
  });

  it('14. generateActivityGraphSVG', () => {
    const svg = generateActivityGraphSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateActivityGraphSVG', svg);
  });

  it('15. generateRadarSVG', () => {
    const svg = generateRadarSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateRadarSVG', svg);
  });

  it('16. generateRepoSpotlightSVG', () => {
    const svg = generateRepoSpotlightSVG(mockRepoDetails, mockParams);
    compareOrUpdateVisualBaseline('generateRepoSpotlightSVG', svg);
  });

  it('17. generateWeekdaySVG', () => {
    const svg = generateWeekdaySVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateWeekdaySVG', svg);
  });

  it('18. generateCommitClockSVG', () => {
    const svg = generateCommitClockSVG(mockHourCounts, mockStats, mockParams);
    compareOrUpdateVisualBaseline('generateCommitClockSVG', svg);
  });

  it('19. generateConstellationSVG', () => {
    const svg = generateConstellationSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateConstellationSVG', svg);
  });

  it('20. generateDoughnutSVG', () => {
    const svg = generateDoughnutSVG(mockStats, mockParams, mockCalendar);
    compareOrUpdateVisualBaseline('generateDoughnutSVG', svg);
  });
});
