export type GraphKind = 'snake' | 'pacman';
export type GraphPlacement = 'top' | 'middle' | 'bottom';

/**
 * Builds the GitHub Actions workflow YAML for a given graph kind, scoped to
 * the entered username. Using `github.repository_owner` (the original
 * static template) works fine when the workflow lives in the user's own
 * `<username>/<username>` profile repo, but spelling out the literal
 * username makes the generated file self-explanatory and copy-paste safe
 * even if someone places it in a differently-named repo or forks the setup.
 */
export function generateWorkflowYaml(kind: GraphKind, username: string): string {
  const safeUsername = username.trim();

  if (kind === 'snake') {
    return `name: GitHub Snake Game

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  generate:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Generate GitHub Contributions Snake Animations
        uses: Platane/snk@v3
        with:
          github_user_name: ${safeUsername}
          outputs: |
            dist/github-snake.svg
            dist/github-snake-dark.svg?palette=github-dark
            dist/ocean.gif?color_snake=orange&color_dots=#bfd6f6,#8dbdff,#64a1f4,#4b91f1,#3c7dd9
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Deploy to Output Branch
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: output
          commit_message: "Update snake animation [skip ci]"`;
  }

  return `name: Generate Pacman

on:
  schedule:
    - cron: "0 */24 * * *"
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  generate:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Generate Pacman contribution graph SVG
        uses: abozanona/pacman-contribution-graph@main
        with:
          github_user_name: ${safeUsername}
      - name: Push Pacman SVG to output branch
        uses: crazy-max/ghaction-github-pages@v3.1.0
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`;
}

/**
 * Builds the README markdown snippet that embeds the generated SVG, ready to
 * paste directly into a GitHub profile README.md. Uses a light/dark picture
 * source for the snake graph (matching the two SVG outputs the workflow
 * produces) and a single image for the pacman graph.
 */
export function generateReadmeSnippet(kind: GraphKind, username: string): string {
  const safeUsername = username.trim();

  if (kind === 'snake') {
    return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${safeUsername}/${safeUsername}/output/github-snake-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${safeUsername}/${safeUsername}/output/github-snake.svg" />
  <img alt="${safeUsername}'s GitHub Snake Contribution Graph" src="https://raw.githubusercontent.com/${safeUsername}/${safeUsername}/output/github-snake.svg" />
</picture>`;
  }

  return `![${safeUsername}'s Pacman Contribution Graph](https://raw.githubusercontent.com/${safeUsername}/${safeUsername}/output/pacman-contribution-graph.svg)`;
}

/**
 * Filename for the workflow file as it should be saved under
 * `.github/workflows/` in the user's `<username>/<username>` repo.
 */
export function getWorkflowFilename(kind: GraphKind): string {
  return kind === 'snake' ? 'snake-graph.yml' : 'pacman-graph.yml';
}

/**
 * Human-readable placement hint shown alongside the README snippet, telling
 * the user roughly where in their README.md the snippet should go.
 */
export function getPlacementHint(placement: GraphPlacement): string {
  switch (placement) {
    case 'top':
      return 'Paste this near the top of your README.md, just below your profile header.';
    case 'middle':
      return 'Paste this in the middle of your README.md, between your intro and your stats sections.';
    case 'bottom':
      return 'Paste this near the bottom of your README.md, after your other stats widgets.';
  }
}
