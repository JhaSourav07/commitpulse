import { describe, it, expect } from 'vitest';
import {
  generateWorkflowYaml,
  generateReadmeSnippet,
  getWorkflowFilename,
  getPlacementHint,
} from './snakeWorkflowGenerator';

describe('generateWorkflowYaml', () => {
  it('embeds the literal username for snake workflow', () => {
    const yaml = generateWorkflowYaml('snake', 'octocat');
    expect(yaml).toContain('github_user_name: octocat');
    expect(yaml).not.toContain('github.repository_owner');
  });

  it('embeds the literal username for pacman workflow', () => {
    const yaml = generateWorkflowYaml('pacman', 'octocat');
    expect(yaml).toContain('github_user_name: octocat');
    expect(yaml).not.toContain('github.repository_owner');
  });

  it('trims whitespace from the username', () => {
    const yaml = generateWorkflowYaml('snake', '  octocat  ');
    expect(yaml).toContain('github_user_name: octocat');
  });

  it('still references secrets.GITHUB_TOKEN (not a literal secret)', () => {
    const yaml = generateWorkflowYaml('snake', 'octocat');
    expect(yaml).toContain('${{ secrets.GITHUB_TOKEN }}');
  });

  it('snake workflow uses Platane/snk action', () => {
    expect(generateWorkflowYaml('snake', 'octocat')).toContain('uses: Platane/snk@v3');
  });

  it('pacman workflow uses abozanona/pacman-contribution-graph action', () => {
    expect(generateWorkflowYaml('pacman', 'octocat')).toContain(
      'uses: abozanona/pacman-contribution-graph@main'
    );
  });
});

describe('generateReadmeSnippet', () => {
  it('builds a picture element with light/dark sources for snake', () => {
    const snippet = generateReadmeSnippet('snake', 'octocat');
    expect(snippet).toContain('<picture>');
    expect(snippet).toContain(
      'https://raw.githubusercontent.com/octocat/octocat/output/github-snake.svg'
    );
    expect(snippet).toContain(
      'https://raw.githubusercontent.com/octocat/octocat/output/github-snake-dark.svg'
    );
  });

  it('builds a single markdown image for pacman', () => {
    const snippet = generateReadmeSnippet('pacman', 'octocat');
    expect(snippet).toContain(
      "![octocat's Pacman Contribution Graph](https://raw.githubusercontent.com/octocat/octocat/output/pacman-contribution-graph.svg)"
    );
  });

  it('trims whitespace from the username', () => {
    const snippet = generateReadmeSnippet('pacman', '  octocat  ');
    expect(snippet).toContain('raw.githubusercontent.com/octocat/octocat');
  });
});

describe('getWorkflowFilename', () => {
  it('returns the snake filename', () => {
    expect(getWorkflowFilename('snake')).toBe('snake-graph.yml');
  });

  it('returns the pacman filename', () => {
    expect(getWorkflowFilename('pacman')).toBe('pacman-graph.yml');
  });
});

describe('getPlacementHint', () => {
  it('returns a distinct, non-empty hint for each placement', () => {
    const top = getPlacementHint('top');
    const middle = getPlacementHint('middle');
    const bottom = getPlacementHint('bottom');

    expect(top.length).toBeGreaterThan(0);
    expect(middle.length).toBeGreaterThan(0);
    expect(bottom.length).toBeGreaterThan(0);
    expect(new Set([top, middle, bottom]).size).toBe(3);
  });
});
