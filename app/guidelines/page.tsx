'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/TranslationContext';
import {
  ArrowLeft,
  Award,
  Code2,
  GitBranch,
  Users,
  Target,
  Shield,
  Zap,
  Heart,
  BookOpen,
} from 'lucide-react';

export default function GuidelinesPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-lg fixed w-full z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            ⚡ CommitPulse
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 text-teal-400 rounded-full text-sm mb-4">
            <Users size={18} /> COMMUNITY GUIDELINES
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6">
            Contributing to CommitPulse
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Built by the open-source community, for the open-source community.
            <br />
            Premium quality • Respect • Kindness
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-20">
          {/* Code of Conduct */}
          <section id="conduct">
            <div className="flex items-center gap-4 mb-8">
              <Shield className="text-violet-400" size={36} />
              <h2 className="text-4xl font-semibold">Contributor Covenant Code of Conduct</h2>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 space-y-10 text-zinc-300">
              <div>
                <h3 className="text-2xl font-semibold text-teal-400 mb-4">🤝 Our Pledge</h3>
                <p>
                  We pledge to make participation in our community a harassment-free experience for
                  everyone. We are committed to creating an inclusive, friendly, and respectful
                  environment where collaboration thrives.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-teal-400 mb-4">🌟 Our Standards</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Show empathy and kindness toward others</li>
                  <li>Respect differing opinions and experiences</li>
                  <li>Give and accept constructive feedback gracefully</li>
                  <li>Take responsibility for our mistakes and learn from them</li>
                  <li>Focus on what benefits the whole community</li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-red-400 mb-4">
                  🚫 Unacceptable Behavior
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use of sexualized language or imagery</li>
                  <li>Harassment, bullying, or personal/political attacks</li>
                  <li>Publishing private information without consent</li>
                  <li>Disruptive, unprofessional, or harmful behavior</li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4">🛡 Enforcement & Reporting</h3>
                <p>
                  Community leaders are responsible for enforcing this Code of Conduct. Report
                  violations to the maintainers. All reports will be handled with confidentiality
                  and respect. No retaliation will occur against good-faith reporters.
                </p>
                <p className="mt-4 text-sm text-zinc-400">
                  Consequences range from warnings to temporary or permanent bans.
                </p>
              </div>
            </div>
          </section>

          {/* The Standard We Hold */}
          <section id="standard">
            <div className="flex items-center gap-4 mb-8">
              <Award className="text-amber-400" size={36} />
              <h2 className="text-4xl font-semibold">The Standard We Hold</h2>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10">
              <p className="text-lg text-zinc-300 mb-8">
                CommitPulse is a premium, high-fidelity data visualization tool. Every contribution
                must uphold this standard.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-teal-400 mb-4">✅ Premium Quality Means</h4>
                  <ul className="space-y-2 text-zinc-300">
                    <li>Curated harmonious color palettes</li>
                    <li>Smooth and purposeful animations</li>
                    <li>Typography matching the design system</li>
                    <li>Cohesive, professional-looking themes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-red-400 mb-4">❌ Not Acceptable</h4>
                  <ul className="space-y-2 text-zinc-300">
                    <li>Raw unstyled SVG elements</li>
                    <li>Arbitrary or clashing colors</li>
                    <li>Janky or distracting animations</li>
                    <li>Breaking changes without migration path</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Local Setup & Testing */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <Code2 className="text-teal-400" size={36} />
              <h2 className="text-4xl font-semibold">Local Setup & Testing</h2>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10">
              <pre className="bg-black/70 p-6 rounded-2xl overflow-x-auto text-sm mb-6">
                {`git clone https://github.com/JhaSourav07/commitpulse.git
cd commitpulse
npm install
cp .env.local.example .env.local
npm run dev`}
              </pre>
              <p className="text-zinc-400 mb-6">
                Test your badge at: <code>http://localhost:3000/api/streak?user=YOUR_USERNAME</code>
              </p>
              <p className="text-sm text-zinc-500">
                Required before every PR: <code>npm run test</code> • <code>npm run lint</code> •{' '}
                <code>npm run test:coverage</code> (≥70% branch coverage)
              </p>
            </div>
          </section>

          {/* What to Contribute */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <Target className="text-violet-400" size={36} />
              <h2 className="text-4xl font-semibold">What to Contribute</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold mb-2">Pillar 1 — New Theme Design</h3>
                <p className="text-zinc-400">
                  Add high-quality themes in <code>lib/svg/themes.ts</code>
                </p>
              </div>
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
                <div className="text-4xl mb-4">📐</div>
                <h3 className="text-xl font-semibold mb-2">
                  Pillar 2 — Geometric SVG Improvements
                </h3>
                <p className="text-zinc-400">
                  Enhance the isometric renderer in <code>lib/svg/generator.ts</code>
                </p>
              </div>
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
                <div className="text-4xl mb-4">🕐</div>
                <h3 className="text-xl font-semibold mb-2">Pillar 3 — Timezone Logic</h3>
                <p className="text-zinc-400">Improve accuracy and edge cases</p>
              </div>
            </div>
          </section>

          {/* PR Workflow */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <GitBranch className="text-emerald-400" size={36} />
              <h2 className="text-4xl font-semibold">Opening a Pull Request</h2>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 text-zinc-300">
              <p className="mb-6">
                Use the provided PR template. Include visual preview for any SVG changes. Follow
                Conventional Commits. Prefer one meaningful commit per PR.
              </p>
              <div className="inline-flex items-center gap-3 bg-black/50 px-5 py-3 rounded-2xl">
                <Zap className="text-teal-400" /> Run all tests and linting locally before
                submitting
              </div>
            </div>
          </section>

          {/* Community Guidelines */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <Heart className="text-pink-400" size={36} />
              <h2 className="text-4xl font-semibold">Community Guidelines</h2>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 text-zinc-300">
              <p>
                Ask questions freely. Teach, don&apos;t gatekeep. Ship complete work. Credit others.
                This is a space where learning and collaboration are celebrated.
              </p>
            </div>
          </section>
        </div>

        <div className="text-center mt-20 text-zinc-500 text-sm">
          Thank you for contributing to CommitPulse 💚
          <br />
          Made with respect for every contributor — from first-timers to experienced developers.
        </div>
      </div>
    </div>
  );
}
