import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { CodeBlock } from './code-block';
import { themes as themePalette } from '@/lib/svg/themes';

export const metadata: Metadata = {
  title: 'Documentation | CommitPulse',
  description:
    'Complete guide to embedding and customizing your CommitPulse streak badge. API parameters, themes, and examples.',
};

const API_BASE_URL = 'https://commitpulse.vercel.app/api/streak';
const USERNAME_PLACEHOLDER = 'YOUR_USERNAME';

const buildSnippet = (query = '') =>
  `![CommitPulse](${API_BASE_URL}?user=${USERNAME_PLACEHOLDER}${query})`;

const quickStartSnippet = buildSnippet();

const exampleSnippets = [
  {
    title: 'Default embed',
    description: 'The fastest way to drop the monolith into your profile README.',
    code: buildSnippet(),
  },
  {
    title: 'Neon theme',
    description: 'Swap the default palette for the high-contrast cyberpunk preset.',
    code: buildSnippet('&theme=neon'),
  },
  {
    title: 'Custom colors',
    description: 'Override the background, accent, and text colors directly with hex values.',
    code: buildSnippet('&bg=0a0a0a&accent=ff6b35&text=ffffff&radius=16'),
  },
  {
    title: 'Fresh data',
    description: 'Force a cache bypass when you want the latest contribution state immediately.',
    code: buildSnippet('&refresh=true'),
  },
];

const parameters = [
  {
    name: 'user',
    type: 'string',
    required: 'Yes',
    defaultValue: 'None',
    description: 'GitHub username to render. This is the only required parameter.',
  },
  {
    name: 'theme',
    type: 'string',
    required: 'No',
    defaultValue: 'dark',
    description: 'Preset palette name. Choose from dark, neon, dracula, github, or light.',
  },
  {
    name: 'bg',
    type: 'hex',
    required: 'No',
    defaultValue: 'Theme default',
    description: 'Background color without the # prefix.',
  },
  {
    name: 'accent',
    type: 'hex',
    required: 'No',
    defaultValue: 'Theme default',
    description: 'Tower, glow, and emphasis color without the # prefix.',
  },
  {
    name: 'text',
    type: 'hex',
    required: 'No',
    defaultValue: 'Theme default',
    description: 'Label and stat text color without the # prefix.',
  },
  {
    name: 'radius',
    type: 'number',
    required: 'No',
    defaultValue: '8',
    description: 'Border radius in pixels for the generated SVG card.',
  },
  {
    name: 'refresh',
    type: 'boolean',
    required: 'No',
    defaultValue: 'false',
    description: 'Bypass the cache for real-time refreshes.',
  },
];

const themeDescriptions: Record<
  string,
  {
    name: string;
    vibe: string;
  }
> = {
  dark: {
    name: 'Dark',
    vibe: 'GitHub-inspired dark mode with cool blue highlights and balanced contrast.',
  },

  neon: {
    name: 'Neon',
    vibe: 'Cyberpunk-inspired black canvas with glowing cyan text and vivid magenta accents.',
  },

  dracula: {
    name: 'Dracula',
    vibe: 'A Dracula-inspired dark theme with deep backgrounds and signature purple (#bd93f9) accents.',
  },

  github: {
    name: 'GitHub',
    vibe: 'Classic GitHub-inspired dark palette with signature contribution green accents.',
  },

  light: {
    name: 'Light',
    vibe: 'Clean bright theme designed for minimal portfolios and light backgrounds.',
  },

  ocean: {
    name: 'Ocean',
    vibe: 'Deep oceanic blues with soft teal accents for a calm futuristic aesthetic.',
  },

  sunset: {
    name: 'Sunset',
    vibe: 'Warm sunset-inspired palette with glowing orange accents and soft peach text.',
  },

  forest: {
    name: 'Forest',
    vibe: 'Nature-inspired dark green theme with vibrant emerald highlights.',
  },

  rose: {
    name: 'Rose',
    vibe: 'Elegant rose-tinted palette with soft pink highlights and deep berry tones.',
  },

  nord: {
    name: 'Nord',
    vibe: 'Muted arctic-inspired colors with icy blue accents and soft contrast.',
  },

  synthwave: {
    name: 'Synthwave',
    vibe: 'Retro-futuristic neon palette with electric pink highlights on deep violet tones.',
  },

  gruvbox: {
    name: 'Gruvbox',
    vibe: 'Retro-inspired warm palette with earthy tones and vintage terminal aesthetics.',
  },

  highcontrast: {
    name: 'High Contrast',
    vibe: 'Ultra-high contrast dark theme with bold orange-red highlights for maximum visibility.',
  },

  catppuccin_latte: {
    name: 'Catppuccin Latte',
    vibe: 'A cozy, warm light theme from the popular Catppuccin palette.',
  },

  solarized_light: {
    name: 'Solarized Light',
    vibe: 'The classic Solarized light palette with excellent contrast and retro aesthetics.',
  },

  gruvbox_light: {
    name: 'Gruvbox Light',
    vibe: 'Earthy, warm retro cream background with high-contrast charcoal text.',
  },

  nord_light: {
    name: 'Nord Light',
    vibe: 'Ice-cold and minimal light gray palette with signature arctic-blue accents.',
  },
};

const allthemes = Object.entries(themePalette).map(([slug, palette]) => ({
  slug,
  ...(themeDescriptions[slug] || {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    vibe: 'Custom theme palette.',
  }),
  ...palette,
}));

const contributorNotes = [
  'URL parameters override theme defaults, and theme defaults override the system fallback palette.',
  'Contribution counts stay aligned with GitHub by syncing cache invalidation to UTC midnight boundaries.',
  'The API layer bypasses internal fetch caching so HTTP cache headers stay the single source of truth.',
];

export default function DocumentationPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-transparent text-black dark:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Layered brand glows for depth */}
        <div className="absolute left-[-10%] top-[-8%] h-[40rem] w-[40rem] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute right-[-5%] top-[10%] h-[35rem] w-[35rem] rounded-full bg-cyan-400/10 blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[15%] h-[45rem] w-[45rem] rounded-full bg-indigo-500/10 blur-[140px]" />
        {/* Noise texture overlay for a premium surface feel */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 pb-10 pt-6 md:px-8">
        <section className="mb-10 rounded-[2rem] border border-black/10 bg-white px-6 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:px-10">
          <div className="mb-6 inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
            Documentation
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-black dark:text-white md:text-6xl">
                The manual for building your profile monument.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-gray-600 dark:text-white/65 md:text-lg">
                Everything in the README, reshaped into a cleaner in-product guide so users can go
                from copy-paste embed to fully customized monolith without leaving the site.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-black/10 bg-gray-100 p-5 dark:border-white/10 dark:bg-black/40">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-white/60">
                Priority chain
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-gray-800 dark:border-white/8 dark:bg-white/[0.03] dark:text-white">
                  URL Parameter
                </div>
                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-gray-800 dark:border-white/8 dark:bg-white/[0.03] dark:text-white">
                  Theme Default
                </div>
                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-gray-800 dark:border-white/8 dark:bg-white/[0.03] dark:text-white">
                  System Fallback
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 flex flex-col items-stretch gap-6">
          <Panel
            eyebrow="Quick Start"
            title="Add the default badge in one line"
            description="Paste this snippet into any Markdown surface that supports remote images, including your GitHub profile README, a portfolio page, or internal docs."
          >
            <CodeBlock code={quickStartSnippet} />
            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-white/50">
              Replace{' '}
              <code className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-800 dark:bg-white/10 dark:text-white/80">
                YOUR_USERNAME
              </code>{' '}
              with your GitHub handle and the API will render the default dark theme automatically.
            </p>
          </Panel>

          <Panel
            eyebrow="Live Examples"
            title="Common configurations you can ship immediately"
            description="These examples mirror the most useful README snippets, but in a format designed for fast scanning."
          >
            <div className="space-y-4">
              {exampleSnippets.map((snippet) => (
                <div
                  key={snippet.title}
                  className="rounded-[1.5rem] border border-black/10 bg-gray-50 p-4 dark:border-white/8 dark:bg-black/35"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-black dark:text-white">
                      {snippet.title}
                    </h3>
                    <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:border-white/10 dark:text-white/60">
                      snippet
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-6 text-gray-600 dark:text-white/55">
                    {snippet.description}
                  </p>
                  <CodeBlock code={snippet.code} />
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-8">
          <Panel
            eyebrow="Parameter Reference"
            title="Every URL knob, organized for implementation"
            description="All color parameters expect hex values without a leading #. When both a theme and manual colors are provided, the manual colors win."
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-black/10 dark:border-white/8">
              <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-gray-50 px-4 py-3 text-xs uppercase tracking-[0.18em] text-gray-500 dark:border-white/8 dark:bg-white/[0.03] dark:text-white/60">
                <span>Swipe to view all columns on smaller screens</span>
                <span className="hidden rounded-full border border-black/10 px-2 py-1 text-[10px] text-gray-500 dark:border-white/10 dark:text-white/50 sm:inline-flex">
                  scroll
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent dark:from-[#050505] sm:hidden" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-[#050505] dark:via-[#050505]/90 sm:hidden" />
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] border-collapse text-left sm:min-w-full">
                    <thead className="bg-gray-50 text-xs uppercase tracking-[0.2em] text-gray-500 dark:bg-white/[0.05] dark:text-white/60">
                      <tr>
                        <th className="px-4 py-4 font-semibold">Parameter</th>
                        <th className="px-4 py-4 font-semibold">Type</th>
                        <th className="px-4 py-4 font-semibold">Required</th>
                        <th className="px-4 py-4 font-semibold">Default</th>
                        <th className="px-4 py-4 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black/25">
                      {parameters.map((parameter) => (
                        <tr
                          key={parameter.name}
                          className="border-t border-black/10 align-top dark:border-white/8"
                        >
                          <td className="px-4 py-4 font-mono text-sm text-emerald-700 dark:text-emerald-300">
                            {parameter.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-white/75">
                            {parameter.type}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-white/75">
                            {parameter.required}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-white/75">
                            {parameter.defaultValue}
                          </td>
                          <td className="px-4 py-4 text-sm leading-6 text-gray-600 dark:text-white/70">
                            {parameter.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="mb-8">
          <Panel
            eyebrow="Theme Gallery"
            title="Preset palettes for different moods"
            description="Use the theme parameter for fast styling, then override individual values only when you need a custom blend."
          >
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allthemes.map((theme) => (
                <div
                  key={theme.slug}
                  className="rounded-[1.5rem] border border-black/10 bg-gray-50 p-5 transition hover:-translate-y-1 dark:border-white/8 dark:bg-black/35"
                >
                  <div
                    className="mb-4 h-32 rounded-[1.25rem] border border-white/10"
                    style={{
                      background: `linear-gradient(145deg, #${theme.bg}, #111111)`,
                      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 20px 40px -24px #${theme.accent}`,
                    }}
                  >
                    <div className="flex h-full items-end justify-between p-4">
                      <span
                        className="text-xs font-semibold uppercase tracking-[0.22em]"
                        style={{ color: `#${theme.text}` }}
                      >
                        {theme.name}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: `#${theme.accent}` }}
                      >
                        {theme.slug}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-black dark:text-white">
                    {theme.name}
                  </h3>
                  <p className="mt-2 min-h-[72px] text-sm leading-7 text-gray-600 dark:text-white/55">
                    {theme.vibe}
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-white/60">
                    <div>
                      <span className="text-gray-700 dark:text-white/75">bg</span> #{theme.bg}
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-white/75">accent</span> #
                      {theme.accent}
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-white/75">text</span> #{theme.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-12 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel
            eyebrow="Contributor Guidance"
            title="Technical context behind the public API"
            description="These notes come straight from the current implementation approach in the README and help contributors understand why the route behaves the way it does."
          >
            <div className="space-y-3">
              {contributorNotes.map((note) => (
                <div
                  key={note}
                  className="flex gap-3 rounded-[1.25rem] border border-black/10 bg-gray-50 px-4 py-4 dark:border-white/8 dark:bg-black/35"
                >
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
                  <p className="text-sm leading-7 text-gray-600 dark:text-white/70">{note}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            eyebrow="Next Step"
            title="Need deeper project context?"
            description="The README still covers architecture, deployment, and contributor onboarding in more detail."
          >
            <div className="flex h-full flex-col justify-between rounded-[1.5rem] border border-black/10 bg-gray-50 p-5 dark:border-white/8 dark:bg-black/35">
              <div>
                <p className="text-sm leading-7 text-gray-600 dark:text-white/60">
                  This page is the fast implementation manual. For self-hosting, architecture
                  details, and repository-level contributor guidance, jump to the full source docs.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://github.com/JhaSourav07/commitpulse/blob/main/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Open README
                </a>
                <Link
                  href="/"
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-black/20 hover:text-black dark:border-white/10 dark:bg-transparent dark:text-white/75 dark:hover:border-white/20 dark:hover:text-white"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </Panel>
        </section>
        <section className="mb-8">
          <Panel
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            description="Quick answers to the most common questions from the CommitPulse community."
          >
            <div className="space-y-3">
              {[
                {
                  q: 'How do I change the accent color of my badge?',
                  a: 'Add &accent=ff6b35 to your URL with any hex color (no # needed). This overrides the theme accent color.',
                },
                {
                  q: 'Can I use a custom font?',
                  a: 'Yes — use the &font= parameter. Pass any Google Font name (e.g. &font=Fira+Code). If left blank, the theme default is used.',
                },
                {
                  q: 'Why does my badge show NOT FOUND?',
                  a: 'This means the GitHub username does not exist or has no public contribution data. Double-check your username spelling.',
                },
                {
                  q: 'How do I embed the badge in my README?',
                  a: 'Copy the markdown snippet from the homepage and paste it into your GitHub profile README. The badge renders automatically.',
                },
                {
                  q: 'Can I preview my badge before adding it to my README?',
                  a: 'Yes! Enter your GitHub username on the homepage to instantly preview your 3D contribution monolith before copying the link.',
                },
                {
                  q: 'Which themes are available?',
                  a: 'CommitPulse includes dark, neon, dracula, github, light, ocean, sunset, forest, rose, nord, synthwave, gruvbox and highcontrast. See the Theme Gallery above for previews.',
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-[1.25rem] border border-black/10 bg-gray-50 px-5 py-4 dark:border-white/8 dark:bg-black/35"
                >
                  <p className="text-sm font-semibold text-black dark:text-white">{q}</p>
                  <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-white/60">{a}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_30px_80px_rgba(0,0,0,0.32)] md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 dark:text-white/55 md:text-base">
        {description}
      </p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
