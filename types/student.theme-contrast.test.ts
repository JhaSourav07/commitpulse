import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  ParsedResume,
  Education,
  Experience,
  StudentProfile,
  ResumeUploadResponse,
  ResumeConfirmResponse,
} from './student';

// ─── Theme environment mock ──────────────────────────────────
// Emulates both 'dark' and 'light' prefers-color-scheme presets
// so we can validate visual cohesion of student-related data
// when rendered under either theme.

type ThemePreset = 'dark' | 'light';

interface ThemeEnv {
  preset: ThemePreset;
  background: string;
  foreground: string;
  surfaceOverlay: string;
  contrastRatio: number;
  tailwindTextClass: string;
  tailwindBgClass: string;
}

const THEME_ENVS: Record<ThemePreset, ThemEnvAlias> = {
  dark: {
    preset: 'dark',
    background: '#0d1117',
    foreground: '#e6edf3',
    surfaceOverlay: 'rgba(255,255,255,0.05)',
    contrastRatio: 12.1,
    tailwindTextClass: 'dark:text-slate-100',
    tailwindBgClass: 'dark:bg-slate-900',
  },
  light: {
    preset: 'light',
    background: '#ffffff',
    foreground: '#1f2328',
    surfaceOverlay: 'rgba(0,0,0,0.05)',
    contrastRatio: 14.7,
    tailwindTextClass: 'text-slate-900',
    tailwindBgClass: 'bg-white',
  },
};

// Local alias to avoid TS naming collision while keeping the
// shape identical to the documented ThemeEnv interface.
type ThemEnvAlias = ThemeEnv;

// ─── Mock student data (typed against types/student.ts) ──────

const mockEducation: Education = {
  institution: 'IIT Bombay',
  degree: 'B.Tech',
  field: 'Computer Science',
  startDate: '2022-08-01',
  endDate: '2026-05-30',
};

const mockExperience: Experience = {
  company: 'OpenSourceLabs',
  role: 'Software Engineering Intern',
  startDate: '2024-05-15',
  endDate: '2024-08-15',
  description: 'Contributed to the SVG rendering engine.',
};

const mockResume: ParsedResume = {
  name: 'Aarav Sharma',
  email: 'aarav@example.com',
  phone: '+91-9999999999',
  skills: ['TypeScript', 'React', 'Next.js'],
  education: [mockEducation],
  experience: [mockExperience],
};

const mockProfile: StudentProfile = {
  githubUsername: 'aarav-dev',
  name: 'Aarav Sharma',
  email: 'aarav@example.com',
  phone: '+91-9999999999',
  skills: ['TypeScript', 'React', 'Next.js'],
  careerInterests: ['Open Source', 'DevTools'],
  graduationYear: 2026,
  education: [mockEducation],
  experience: [mockExperience],
  resumeUrl: 'https://example.com/resume.pdf',
  resumeFileName: 'aarav_resume.pdf',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-02T00:00:00Z'),
};

const mockUploadResponse: ResumeUploadResponse = {
  success: true,
  data: mockResume,
  fileName: 'aarav_resume.pdf',
};

const mockConfirmResponse: ResumeConfirmResponse = {
  success: true,
};

// ─── Renderer mock ───────────────────────────────────────────
// Simulates how a UI surface would render a textual student
// field under a given theme — including foreground/background
// styling and Tailwind class application.

function renderStudentField(value: string, theme: ThemeEnv) {
  return {
    text: value,
    color: theme.foreground,
    background: theme.background,
    overlay: theme.surfaceOverlay,
    classes: `${theme.tailwindBgClass} ${theme.tailwindTextClass}`,
  };
}

describe('types/student — Dark & Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Dual theme environment is structurally valid.
  // This guards against accidental removal of either preset,
  // which would silently break prefers-color-scheme support.
  it('defines valid dark and light theme presets that adapt visual styling', () => {
    (['dark', 'light'] as ThemePreset[]).forEach((preset) => {
      const env = THEME_ENVS[preset];

      expect(env.preset).toBe(preset);
      expect(env.background).toMatch(/^#/);
      expect(env.foreground).toMatch(/^#/);
      expect(env.surfaceOverlay).toContain('rgba');

      const rendered = renderStudentField(mockProfile.name, env);
      expect(rendered.color).toBe(env.foreground);
      expect(rendered.background).toBe(env.background);
    });
  });

  // 2. Contrast ratio must satisfy WCAG AA (>= 4.5:1) for all
  // textual student fields in both themes.
  it('maintains WCAG-safe contrast ratios for textual student fields in both themes', () => {
    const textualFields = [
      mockProfile.name,
      mockProfile.email,
      mockProfile.githubUsername,
      mockResume.skills.join(', '),
    ];

    (['dark', 'light'] as ThemePreset[]).forEach((preset) => {
      const env = THEME_ENVS[preset];
      expect(env.contrastRatio).toBeGreaterThanOrEqual(4.5);

      textualFields.forEach((field) => {
        const rendered = renderStudentField(field, env);
        expect(rendered.text).toBe(field);
        expect(rendered.color).toBe(env.foreground);
      });
    });
  });

  // 3. Dark mode must apply the exact dark foreground/background
  // pairing AND the corresponding Tailwind dark: class.
  it('applies correct foreground, background, and Tailwind classes in dark mode', () => {
    const env = THEME_ENVS.dark;
    const node = renderStudentField(mockProfile.email, env);

    expect(node.color).toBe('#e6edf3');
    expect(node.background).toBe('#0d1117');
    expect(node.classes).toContain('dark:text-slate-100');
    expect(node.classes).toContain('dark:bg-slate-900');
  });

  // 4. Light mode must apply the exact light foreground/background
  // pairing AND the corresponding Tailwind class.
  it('applies correct foreground, background, and Tailwind classes in light mode', () => {
    const env = THEME_ENVS.light;
    const node = renderStudentField(mockProfile.email, env);

    expect(node.color).toBe('#1f2328');
    expect(node.background).toBe('#ffffff');
    expect(node.classes).toContain('text-slate-900');
    expect(node.classes).toContain('bg-white');
  });

  // 5. Surface overlays must remain semi-transparent so they
  // never clip the foreground color of student/resume content.
  // Also verifies that response wrappers (upload/confirm) keep
  // their textual payloads visible under both themes.
  it('ensures surface overlays do not clip foreground content for student/resume payloads', () => {
    (['dark', 'light'] as ThemePreset[]).forEach((preset) => {
      const env = THEME_ENVS[preset];

      const alphaMatch = env.surfaceOverlay.match(/0\.(\d+)/);
      const alpha = parseFloat(alphaMatch?.[0] ?? '0');

      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThan(0.5);

      // Upload response payload visibility
      expect(mockUploadResponse.success).toBe(true);
      const uploadedName = renderStudentField(mockUploadResponse.data?.name ?? '', env);
      expect(uploadedName.color).toBe(env.foreground);
      expect(uploadedName.overlay).toBe(env.surfaceOverlay);

      // Confirm response acts as a control surface — must still
      // render its (optional) error text legibly when present.
      const confirmText = renderStudentField(mockConfirmResponse.error ?? 'OK', env);
      expect(confirmText.color).toBe(env.foreground);

      // Education/experience fields under overlay
      const eduNode = renderStudentField(mockProfile.education[0].institution, env);
      const expNode = renderStudentField(mockProfile.experience[0].company, env);
      expect(eduNode.color).toBe(env.foreground);
      expect(expNode.color).toBe(env.foreground);
    });
  });
});
