import { describe, it, expect } from 'vitest';
import { generateLanguagesSVG } from './languagesCard';
import type { LanguageData } from '@/types/dashboard';

describe('LanguagesCard SVG Generator', () => {
  const mockLanguages: LanguageData[] = [
    { name: 'JavaScript', percentage: 45, color: '#f1e05a' },
    { name: 'TypeScript', percentage: 30, color: '#3178c6' },
    { name: 'Python', percentage: 15, color: '#3572A5' },
    { name: 'CSS', percentage: 10, color: '#563d7c' },
  ];

  it('renders empty fallback state when language list is empty', () => {
    const svg = generateLanguagesSVG([]);
    expect(svg).toContain('No Language Data Available');
  });

  it('renders language distribution and percentages correctly', () => {
    const svg = generateLanguagesSVG(mockLanguages, { user: 'octocat' });

    expect(svg).toContain('octocat&#39;s Top Languages');
    expect(svg).toContain('JavaScript');
    expect(svg).toContain('45%');
    expect(svg).toContain('TypeScript');
    expect(svg).toContain('30%');
    expect(svg).toContain('Python');
    expect(svg).toContain('15%');
    expect(svg).toContain('CSS');
    expect(svg).toContain('10%');
    expect(svg).toContain('#f1e05a');
    expect(svg).toContain('#3178c6');
  });

  it('respects custom title, dimensions, radius, and hide_title flags', () => {
    const svg = generateLanguagesSVG(mockLanguages, {
      title: 'Tech Stack Distribution',
      width: 500,
      height: 250,
      radius: 12,
      hide_title: true,
      hide_border: true,
    });

    expect(svg).toContain('width="500"');
    expect(svg).toContain('height="250"');
    expect(svg).toContain('rx="12"');
    expect(svg).not.toContain('Tech Stack Distribution');
  });

  it('limits displayed languages according to count parameter', () => {
    const svg = generateLanguagesSVG(mockLanguages, { count: 2 });

    expect(svg).toContain('class="lang-name">JavaScript</text>');
    expect(svg).toContain('class="lang-name">TypeScript</text>');
    expect(svg).not.toContain('class="lang-name">Python</text>');
    expect(svg).not.toContain('class="lang-name">CSS</text>');
  });

  it('escapes special characters to prevent XML injection', () => {
    const maliciousLangs: LanguageData[] = [
      { name: '<script>alert(1)</script>', percentage: 100, color: '#ff0000' },
    ];
    const svg = generateLanguagesSVG(maliciousLangs, { user: 'user<hack>' });

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(svg).toContain('user&lt;hack&gt;');
  });

  it('applies theme background and text colors', () => {
    const svg = generateLanguagesSVG(mockLanguages, {
      theme: 'dracula',
      bg: '282a36',
      text: 'f8f8f2',
    });

    expect(svg).toContain('fill="#282a36"');
    expect(svg).toContain('fill: #f8f8f2');
  });
});
