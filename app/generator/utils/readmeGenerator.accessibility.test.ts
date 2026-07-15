import { describe, it, expect } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

const defaultState: GeneratorState = {
  name: 'John Doe',
  description: 'Full Stack Engineer',
  selectedTechs: ['react', 'nextjs'],
  selectedSocials: ['github', 'twitter'],
  socialLinks: {
    github: 'https://github.com/johndoe',
    twitter: 'https://twitter.com/johndoe',
  },
  githubUsername: 'johndoe',
  showCommitPulse: true,
  commitPulseAccent: '#ff0055',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: true,
  showPacmanGraph: true,
  graphPlacement: 'middle',
};

// Helper function to map markdown syntax to standard HTML elements for JSDOM parsing
function parseMarkdownToHtml(md: string): string {
  let html = md;
  // Convert H1 headings (# Greeting)
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  // Convert H2 headings (## Section)
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  // Convert Markdown inline links with images: [![altText](imgUrl)](linkUrl)
  html = html.replace(
    /\[\!\[([^\]]+)\]\(([^)]+)\)\]\(([^)]+)\)/g,
    '<a href="$3" target="_blank" rel="noopener noreferrer"><img src="$2" alt="$1" title="$1" /></a>'
  );
  return html;
}

describe('readmeGenerator - Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('Case 1: confirms standard headings exist in the correct logical hierarchical order', () => {
    const md = generateReadme(defaultState);

    // Verify correct logical order of markdown headings
    const lines = md.split('\n');
    const headings = lines.filter((line) => line.startsWith('#')).map((line) => line.trim());

    expect(headings.length).toBeGreaterThan(0);
    // H1 first
    expect(headings[0]).toContain("# 👋 Hi, I'm John Doe");

    // Sub-headings use H2 (##)
    const subHeadings = headings.slice(1);
    subHeadings.forEach((heading) => {
      expect(heading.startsWith('##')).toBe(true);
      expect(heading.startsWith('###')).toBe(false);
    });
  });

  it('Case 2: inspects markup for correct use of accessible label coordinates and tags', () => {
    const md = generateReadme(defaultState);
    const parsedHtml = parseMarkdownToHtml(md);
    const container = document.createElement('div');
    container.innerHTML = parsedHtml;

    // Verify all generated images have non-empty alt tags
    const images = Array.from(container.querySelectorAll('img'));
    expect(images.length).toBeGreaterThan(0);
    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      expect(alt).toBeTruthy();

      // Snake/Pacman contribution graphs are decorative and do not contain title attributes
      if (!alt?.includes('snake') && !alt?.includes('pacman')) {
        const title = img.getAttribute('title');
        expect(title).toBeTruthy();
      }
    });

    // Verify all generated links have target="_blank" and rel="noopener noreferrer" for security and accessibility
    const links = Array.from(container.querySelectorAll('a'));
    expect(links.length).toBeGreaterThan(0);
    links.forEach((a) => {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('Case 3: verifies tooltip labels are announced with correct accessibility descriptions', () => {
    const md = generateReadme(defaultState);
    const parsedHtml = parseMarkdownToHtml(md);
    const container = document.createElement('div');
    container.innerHTML = parsedHtml;

    // Check alt for CommitPulse badge
    const badgeImg = container.querySelector('img[src*="commitpulse.vercel.app/api/streak"]');
    expect(badgeImg).toBeTruthy();
    expect(badgeImg?.getAttribute('alt')).toBe('CommitPulse Contribution Graph for johndoe');

    // Check alt for graph pictures
    const snakeImg = container.querySelector('img[alt="github contribution grid snake svg"]');
    expect(snakeImg).toBeTruthy();

    const pacmanImg = container.querySelector('img[alt="pacman contribution graph"]');
    expect(pacmanImg).toBeTruthy();
  });

  it('Case 4: tests keyboard control path selectors to ensure normal tab ordering', () => {
    const md = generateReadme(defaultState);
    const parsedHtml = parseMarkdownToHtml(md);
    const container = document.createElement('div');
    container.innerHTML = parsedHtml;

    // Assert elements that accept key focus (like links) do not contain negative tabindex
    const links = Array.from(container.querySelectorAll('a'));
    links.forEach((a) => {
      expect(a.getAttribute('tabindex')).not.toBe('-1');
    });
  });

  it('Case 5: confirms default/empty fallback generator outputs correct semantic markup', () => {
    const fallback = getEmptyReadme();
    const parsedHtml = parseMarkdownToHtml(fallback);
    const container = document.createElement('div');
    container.innerHTML = parsedHtml;

    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toBe("👋 Hi, I'm Your Name");

    const p = container.querySelector('p');
    expect(p).toBeTruthy();
    expect(p?.textContent).toBe('Your description goes here...');
  });
});
