import Link from "next/link";

const quickStartSnippet =
  "![CommitPulse](https://commitpulse.vercel.app/api/streak?user=YOUR_USERNAME)";

const exampleSnippets = [
  {
    title: "Default embed",
    description: "The fastest way to drop the monolith into your profile README.",
    code: "![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07)",
  },
  {
    title: "Neon theme",
    description: "Swap the default palette for the high-contrast cyberpunk preset.",
    code: "![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon)",
  },
  {
    title: "Custom colors",
    description: "Override the background, accent, and text colors directly with hex values.",
    code: "![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07&bg=0a0a0a&accent=ff6b35&text=ffffff&radius=16)",
  },
  {
    title: "Fresh data",
    description: "Force a cache bypass when you want the latest contribution state immediately.",
    code: "![CommitPulse](https://commitpulse.vercel.app/api/streak?user=jhasourav07&refresh=true)",
  },
];

const parameters = [
  {
    name: "user",
    type: "string",
    required: "Yes",
    defaultValue: "None",
    description: "GitHub username to render. This is the only required parameter.",
  },
  {
    name: "theme",
    type: "string",
    required: "No",
    defaultValue: "dark",
    description: "Preset palette name. Choose from dark, neon, dracula, github, or light.",
  },
  {
    name: "bg",
    type: "hex",
    required: "No",
    defaultValue: "Theme default",
    description: "Background color without the # prefix.",
  },
  {
    name: "accent",
    type: "hex",
    required: "No",
    defaultValue: "Theme default",
    description: "Tower, glow, and emphasis color without the # prefix.",
  },
  {
    name: "text",
    type: "hex",
    required: "No",
    defaultValue: "Theme default",
    description: "Label and stat text color without the # prefix.",
  },
  {
    name: "radius",
    type: "number",
    required: "No",
    defaultValue: "8",
    description: "Border radius in pixels for the generated SVG card.",
  },
  {
    name: "refresh",
    type: "boolean",
    required: "No",
    defaultValue: "false",
    description: "Bypass the cache for real-time refreshes.",
  },
];

const themes = [
  {
    name: "Dark",
    slug: "dark",
    vibe: "GitHub-dark default with calm blue highlights.",
    bg: "0d1117",
    accent: "58a6ff",
    text: "c9d1d9",
  },
  {
    name: "Neon",
    slug: "neon",
    vibe: "Pure black with magenta towers and cyan text.",
    bg: "000000",
    accent: "ff00ff",
    text: "00ffcc",
  },
  {
    name: "Dracula",
    slug: "dracula",
    vibe: "Purple-forward palette inspired by Dracula Pro.",
    bg: "282a36",
    accent: "bd93f9",
    text: "f8f8f2",
  },
  {
    name: "GitHub",
    slug: "github",
    vibe: "Deep GitHub green for a more native contribution feel.",
    bg: "0d1117",
    accent: "238636",
    text: "ffffff",
  },
  {
    name: "Light",
    slug: "light",
    vibe: "Bright, minimal surface for portfolios and white backgrounds.",
    bg: "ffffff",
    accent: "0969da",
    text: "24292f",
  },
];

const contributorNotes = [
  "URL parameters override theme defaults, and theme defaults override the system fallback palette.",
  "Contribution counts stay aligned with GitHub by syncing cache invalidation to UTC midnight boundaries.",
  "The API layer bypasses internal fetch caching so HTTP cache headers stay the single source of truth.",
];

export default function DocumentationPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute right-[-8%] top-[20%] h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[24rem] w-[24rem] rounded-full bg-orange-400/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 md:px-8">
        <header className="mb-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-white/90 transition hover:text-emerald-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
              CP
            </span>
            CommitPulse
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-white/10 px-4 py-2 text-white/70 transition hover:border-white/20 hover:text-white"
            >
              Home
            </Link>
            <a
              href="https://github.com/JhaSourav07/commitpulse"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 px-4 py-2 text-white/70 transition hover:border-white/20 hover:text-white"
            >
              GitHub
            </a>
          </div>
        </header>

        <section className="mb-10 rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-10 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur md:px-10">
          <div className="mb-6 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Documentation
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
                The manual for building your profile monument.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
                Everything in the README, reshaped into a cleaner in-product guide so users can go from
                copy-paste embed to fully customized monolith without leaving the site.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-black/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
                Priority chain
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  URL Parameter
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  Theme Default
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  System Fallback
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel
            eyebrow="Quick Start"
            title="Add the default badge in one line"
            description="Paste this snippet into any Markdown surface that supports remote images, including your GitHub profile README, a portfolio page, or internal docs."
          >
            <CodeBlock code={quickStartSnippet} />
            <p className="mt-4 text-sm leading-7 text-white/50">
              Replace <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">YOUR_USERNAME</code>{" "}
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
                  className="rounded-[1.5rem] border border-white/8 bg-black/35 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-white">{snippet.title}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      snippet
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-6 text-white/55">{snippet.description}</p>
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
            <div className="overflow-hidden rounded-[1.5rem] border border-white/8">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-white/[0.05] text-xs uppercase tracking-[0.2em] text-white/45">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Parameter</th>
                      <th className="px-4 py-4 font-semibold">Type</th>
                      <th className="px-4 py-4 font-semibold">Required</th>
                      <th className="px-4 py-4 font-semibold">Default</th>
                      <th className="px-4 py-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-black/25">
                    {parameters.map((parameter) => (
                      <tr key={parameter.name} className="border-t border-white/8 align-top">
                        <td className="px-4 py-4 font-mono text-sm text-emerald-300">{parameter.name}</td>
                        <td className="px-4 py-4 text-sm text-white/70">{parameter.type}</td>
                        <td className="px-4 py-4 text-sm text-white/70">{parameter.required}</td>
                        <td className="px-4 py-4 text-sm text-white/70">{parameter.defaultValue}</td>
                        <td className="px-4 py-4 text-sm leading-6 text-white/60">{parameter.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {themes.map((theme) => (
                <div
                  key={theme.slug}
                  className="rounded-[1.5rem] border border-white/8 bg-black/35 p-4"
                >
                  <div
                    className="mb-4 h-28 rounded-[1.25rem] border border-white/10"
                    style={{
                      background: `linear-gradient(145deg, #${theme.bg}, #111111)`,
                      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 20px 40px -24px #${theme.accent}`,
                    }}
                  >
                    <div className="flex h-full items-end justify-between p-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: `#${theme.text}` }}>
                        {theme.name}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: `#${theme.accent}` }}>
                        {theme.slug}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-white">{theme.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{theme.vibe}</p>
                  <div className="mt-4 space-y-2 text-xs text-white/45">
                    <div><span className="text-white/65">bg</span> #{theme.bg}</div>
                    <div><span className="text-white/65">accent</span> #{theme.accent}</div>
                    <div><span className="text-white/65">text</span> #{theme.text}</div>
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
                  className="flex gap-3 rounded-[1.25rem] border border-white/8 bg-black/35 px-4 py-4"
                >
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
                  <p className="text-sm leading-7 text-white/60">{note}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            eyebrow="Next Step"
            title="Need deeper project context?"
            description="The README still covers architecture, deployment, and contributor onboarding in more detail."
          >
            <div className="flex h-full flex-col justify-between rounded-[1.5rem] border border-white/8 bg-black/35 p-5">
              <div>
                <p className="text-sm leading-7 text-white/60">
                  This page is the fast implementation manual. For self-hosting, architecture details,
                  and repository-level contributor guidance, jump to the full source docs.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://github.com/JhaSourav07/commitpulse/blob/main/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
                >
                  Open README
                </a>
                <Link
                  href="/"
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:text-white"
                >
                  Back to Home
                </Link>
              </div>
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
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55 md:text-base">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-[1.5rem] border border-white/8 bg-[#030303] p-4 text-sm leading-7 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <code>{code}</code>
    </pre>
  );
}
