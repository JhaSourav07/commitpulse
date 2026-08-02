import { describe, it, expect } from 'vitest';
import { generateSpotifySVG } from './spotify';
import type { SpotifyTrackData } from '../../services/spotify/api';
import type { SpotifyParams } from '../validations';

describe('[Bug fix] generateSpotifySVG truncates before escaping', () => {
  it('never produces a truncated/incomplete XML entity when a special character sits near the truncation boundary', async () => {
    // 30 raw characters, with '&' positioned right at the truncation
    // boundary once escaped — this is exactly the scenario that broke
    // when escaping happened before truncation.
    const track: SpotifyTrackData = {
      isPlaying: true,
      title: 'A'.repeat(31) + ' & Friends Live Album Version',
      artist: 'Test Artist',
    };
    const params: SpotifyParams = { width: 400, height: 150 } as SpotifyParams;

    const svg = await generateSpotifySVG(track, params, null);

    // No dangling/incomplete entity fragments anywhere in the output.
    expect(svg).not.toMatch(/&(amp|lt|gt|quot|#39|#96)(?!;)/);
  });

  it('still correctly escapes a short title containing an ampersand', async () => {
    const track: SpotifyTrackData = {
      isPlaying: true,
      title: 'Rock & Roll',
      artist: 'AC/DC',
    };
    const params: SpotifyParams = { width: 400, height: 150 } as SpotifyParams;

    const svg = await generateSpotifySVG(track, params, null);

    expect(svg).toContain('Rock &amp; Roll');
  });
});
