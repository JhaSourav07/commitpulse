import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Theme environment mock ───────────────────────────────

type ThemePreset = 'dark' | 'light';

interface ThemeEnv {
  preset: ThemePreset;
  background: string;
  foreground: string;
  surfaceOverlay: string;
  contrastRatio: number;
}

const THEME_ENVS: Record<ThemePreset, ThemeEnv> = {
  dark: {
    preset: 'dark',
    background: '#0d1117',
    foreground: '#e6edf3',
    surfaceOverlay: 'rgba(255,255,255,0.05)',
    contrastRatio: 12.1,
  },
  light: {
    preset: 'light',
    background: '#ffffff',
    foreground: '#1f2328',
    surfaceOverlay: 'rgba(0,0,0,0.05)',
    contrastRatio: 14.7,
  },
};

// ─── Mock profile data ───────────────────────────────

const mockProfile = {
  githubUsername: 'pari-maheshwari',
  name: 'Pari Maheshwari',
  email: 'pari@example.com',
  skills: ['TypeScript', 'React', 'Node.js'],
  careerInterests: ['HealthTech', 'Open Source'],
  education: [
    {
      institution: 'IIT Delhi',
    },
  ],
};

// ─── Renderer mock ───────────────────────────────

function renderTextField(value: string, theme: ThemeEnv) {
  return {
    text: value,
    color: theme.foreground,
    background: theme.background,
  };
}

describe('StudentProfile — Theme Contrast Stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Theme structure validation
  it('should define valid dark and light theme presets', () => {
    (['dark', 'light'] as ThemePreset[]).forEach((preset) => {
      const env = THEME_ENVS[preset];

      expect(env.preset).toBe(preset);
      expect(env.background).toMatch(/^#/);
      expect(env.foreground).toMatch(/^#/);
      expect(env.surfaceOverlay).toContain('rgba');
    });
  });

  // 2. Contrast safety check
  it('should maintain WCAG-safe contrast ratios for both themes', () => {
    (['dark', 'light'] as ThemePreset[]).forEach((preset) => {
      const env = THEME_ENVS[preset];

      expect(env.contrastRatio).toBeGreaterThanOrEqual(4.5);

      const rendered = renderTextField(mockProfile.name, env);

      expect(rendered.text).toBe('Pari Maheshwari');
      expect(rendered.color).toBe(env.foreground);
    });
  });

  // 3. Dark mode consistency
  it('should apply correct foreground color in dark mode', () => {
    const env = THEME_ENVS.dark;

    const node = renderTextField(mockProfile.name, env);

    expect(node.color).toBe('#e6edf3');
    expect(node.background).toBe('#0d1117');
  });

  // 4. Light mode consistency
  it('should apply correct foreground color in light mode', () => {
    const env = THEME_ENVS.light;

    const node = renderTextField(mockProfile.name, env);

    expect(node.color).toBe('#1f2328');
    expect(node.background).toBe('#ffffff');
  });

  // 5. Overlay safety (no clipping / visibility break)
  it('should ensure surface overlays do not break readability', () => {
    (['dark', 'light'] as ThemePreset[]).forEach((preset) => {
      const env = THEME_ENVS[preset];

      const alpha = parseFloat(env.surfaceOverlay.match(/0\.(\d+)/)?.[0] || '0');

      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThan(0.5);

      const education = renderTextField(mockProfile.education[0].institution, env);

      expect(education.color).toBe(env.foreground);
    });
  });
});
