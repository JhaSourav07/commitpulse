import { performance } from 'perf_hooks';
import { generateSVG } from '../lib/svg/generator';
import { hexColor, sanitizeSpeed } from '../lib/svg/sanitizer';

const stats = {
  currentStreak: 12,
  longestStreak: 48,
  totalContributions: 1240,
  todayDate: '2024-01-07',
};

const baseParams = {
  user: 'benchmark-user',
  bg: '0d1117',
  accent: '00ffaa',
  text: 'ffffff',
  scale: 'linear' as const,
  speed: sanitizeSpeed('8s'),
};
const startDate = new Date('2026-05-01');

const calendar = {
  totalContributions: 1240,
  weeks: Array.from({ length: 14 }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) => ({
      contributionCount: Math.floor(Math.random() * 20),
      date: new Date(startDate.getTime() + (weekIndex * 7 + dayIndex) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    })),
  })),
};

const themes = [
  {
    name: 'dark',
    bg: hexColor('0d1117'),
    accent: hexColor('00ffaa'),
    text: hexColor('ffffff'),
  },
  {
    name: 'light',
    bg: hexColor('ffffff'),
    accent: hexColor('ff00aa'),
    text: hexColor('111111'),
  },
  {
    name: 'purple',
    bg: hexColor('1a1025'),
    accent: hexColor('9b5cff'),
    text: hexColor('f5f5f5'),
  },
];

function benchmark(): void {
  console.log('\nSVG Benchmark Results\n');

  for (const theme of themes) {
    const times: number[] = [];

    // warmup
    generateSVG(
      stats,
      {
        ...baseParams,
        bg: theme.bg,
        accent: theme.accent,
        text: theme.text,
      },
      calendar
    );

    for (let i = 0; i < 20; i++) {
      const start = performance.now();

      generateSVG(
        stats,
        {
          ...baseParams,
          bg: theme.bg,
          accent: theme.accent,
          text: theme.text,
        },
        calendar
      );

      const end = performance.now();

      times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`Theme: ${theme.name}`);
    console.log(`Average: ${avg.toFixed(2)}ms`);
    console.log(`Min: ${min.toFixed(2)}ms`);
    console.log(`Max: ${max.toFixed(2)}ms`);
    console.log('--------------------------');
  }
}

benchmark();
