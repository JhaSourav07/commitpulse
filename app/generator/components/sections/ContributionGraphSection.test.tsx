import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContributionGraphSection } from './ContributionGraphSection';

function renderSection(overrides: Partial<Parameters<typeof ContributionGraphSection>[0]> = {}) {
  const props = {
    githubUsername: '',
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'bottom' as const,
    onGithubUsernameChange: vi.fn(),
    onShowSnakeGraphChange: vi.fn(),
    onShowPacmanGraphChange: vi.fn(),
    onGraphPlacementChange: vi.fn(),
    ...overrides,
  };
  const result = render(<ContributionGraphSection {...props} />);

  // The SectionCard wrapper defaults to collapsed (defaultOpen={false}) —
  // expand it so the sub-options (username field, instructions, etc.) mount.
  fireEvent.click(screen.getByText('Contribution Visualizations'));

  return { ...result, props };
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      json: async () => ({ exists: true, login: 'octocat', avatar_url: 'https://x/o.png' }),
    }))
  );
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ContributionGraphSection — workflow & README generation', () => {
  it('shows the instructions panel header even with no username', () => {
    renderSection({ showSnakeGraph: true });
    expect(screen.getByText('How do I set this up on GitHub?')).toBeTruthy();
  });

  it('updates the instructions header once a username is entered', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });
    await waitFor(() => {
      expect(screen.getByText('Your workflow + README code is ready')).toBeTruthy();
    });
  });

  it('generates a username-specific workflow YAML (not the generic repository_owner expression)', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });

    fireEvent.click(screen.getByText('Your workflow + README code is ready'));

    await waitFor(() => {
      expect(screen.getByText(/github_user_name: octocat/)).toBeTruthy();
    });
  });

  it('generates a README markdown snippet with the embedded raw SVG URL', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });
    fireEvent.click(screen.getByText('Your workflow + README code is ready'));

    await waitFor(() => {
      expect(
        screen.getByText((text) => text.includes('raw.githubusercontent.com/octocat/octocat'))
      ).toBeTruthy();
    });
  });

  it('switches between snake and pacman workflow tabs', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });
    fireEvent.click(screen.getByText('Your workflow + README code is ready'));

    await waitFor(() => expect(screen.getByText(/Platane\/snk/)).toBeTruthy());

    fireEvent.click(screen.getByText('Pacman Workflow'));

    await waitFor(() => {
      expect(screen.getByText(/abozanona\/pacman-contribution-graph/)).toBeTruthy();
    });
  });

  it('copies the workflow YAML to clipboard when the copy button is clicked', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });
    fireEvent.click(screen.getByText('Your workflow + README code is ready'));

    await waitFor(() => screen.getByTitle('Copy workflow to clipboard'));
    fireEvent.click(screen.getByTitle('Copy workflow to clipboard'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('github_user_name: octocat')
      );
    });
  });

  it('copies the README snippet to clipboard when its copy button is clicked', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });
    fireEvent.click(screen.getByText('Your workflow + README code is ready'));

    await waitFor(() => screen.getByTitle('Copy README snippet to clipboard'));
    fireEvent.click(screen.getByTitle('Copy README snippet to clipboard'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('raw.githubusercontent.com/octocat/octocat')
      );
    });
  });

  it('shows an "exists" confirmation message once the username is verified', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });

    await waitFor(() => {
      expect(screen.getByText(/GitHub user found/)).toBeTruthy();
    });
  });

  it('shows a "not found" message for a username that does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ exists: false, reason: 'not_found' }),
      }))
    );

    renderSection({ showSnakeGraph: true, githubUsername: 'definitely-not-a-real-user' });

    await waitFor(() => {
      expect(screen.getByText(/No GitHub user named/)).toBeTruthy();
    });
  });

  it('shows an invalid-format warning without calling the existence API', () => {
    renderSection({ showSnakeGraph: true, githubUsername: '-bad-username-' });
    expect(screen.getByText('Invalid username format.')).toBeTruthy();
  });
});

describe('ContributionGraphSection — sample preview fallback', () => {
  it('shows a sample preview image when the live snake graph fails to load', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });

    await waitFor(() => screen.getByAltText(`Snake Contribution Graph for octocat`));
    const liveImg = screen.getByAltText('Snake Contribution Graph for octocat');
    fireEvent.error(liveImg);

    await waitFor(() => {
      expect(screen.getByAltText('Sample illustration of a Snake Contribution Graph')).toBeTruthy();
    });
    expect(screen.getByText('Sample preview')).toBeTruthy();
  });

  it('shows a sample preview image when the live pacman graph fails to load', async () => {
    renderSection({ showPacmanGraph: true, githubUsername: 'octocat' });

    await waitFor(() => screen.getByAltText(`Pacman Contribution Graph for octocat`));
    const liveImg = screen.getByAltText('Pacman Contribution Graph for octocat');
    fireEvent.error(liveImg);

    await waitFor(() => {
      expect(
        screen.getByAltText('Sample illustration of a Pacman Contribution Graph')
      ).toBeTruthy();
    });
    expect(screen.getByText('Sample preview')).toBeTruthy();
  });

  it('mentions the entered username in the sample-preview helper text', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });

    const liveImg = await screen.findByAltText('Snake Contribution Graph for octocat');
    fireEvent.error(liveImg);

    await waitFor(() => {
      expect(screen.getByText((text) => text.includes("isn't available yet"))).toBeTruthy();
    });
    // username appears bolded inline — check it's present somewhere in the panel
    expect(screen.getAllByText('octocat').length).toBeGreaterThan(0);
  });

  it('does not show the sample preview while the live image is still loading', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });

    // Let the existence-check fetch settle first so its state update doesn't
    // leak into this assertion as an unwrapped act() warning.
    await screen.findByAltText('Snake Contribution Graph for octocat');

    // Before onLoad/onError fires, the sample preview shouldn't be present
    expect(screen.queryByText('Sample preview')).toBeNull();
  });

  it('hides the sample preview once the live graph successfully loads', async () => {
    renderSection({ showSnakeGraph: true, githubUsername: 'octocat' });

    const liveImg = await screen.findByAltText('Snake Contribution Graph for octocat');
    fireEvent.load(liveImg);

    expect(screen.queryByText('Sample preview')).toBeNull();
  });
});
