import type { GeneratorState } from '../types';

/**
 * Builds a combined GitHub Actions workflow YAML for updating CommitPulse graphs (Snake/Pacman).
 * Returns null if neither graph is enabled in the configuration.
 */
export function generateReadmeWorkflow(
  state: GeneratorState,
  cron: string = '0 0 * * *'
): string | null {
  if (!state.showSnakeGraph && !state.showPacmanGraph) {
    return null;
  }

  const safeUsername = state.githubUsername?.trim();
  if (!safeUsername) {
    return null;
  }

  const steps = [
    `      - name: Checkout Repository
        uses: actions/checkout@v4`,
  ];

  if (state.showSnakeGraph) {
    steps.push(`      - name: Generate GitHub Contributions Snake Animations
        uses: Platane/snk@v3
        with:
          github_user_name: ${safeUsername}
          outputs: |
            dist/github-snake.svg
            dist/github-snake-dark.svg?palette=github-dark
            dist/ocean.gif?color_snake=orange&color_dots=#bfd6f6,#8dbdff,#64a1f4,#4b91f1,#3c7dd9
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`);
  }

  if (state.showPacmanGraph) {
    steps.push(`      - name: Generate Pacman contribution graph SVG
        uses: abozanona/pacman-contribution-graph@main
        with:
          github_user_name: ${safeUsername}`);
  }

  // Final step to push the generated SVGs to the output branch
  steps.push(`      - name: Deploy to Output Branch
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: output
          commit_message: "Update contribution graphs [skip ci]"`);

  return `name: Update CommitPulse Graphs

on:
  schedule:
    - cron: "${cron}"
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
${steps.join('\n\n')}
`;
}
