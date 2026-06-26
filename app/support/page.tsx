'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/TranslationContext';
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  Users,
  BookOpen,
  Shield,
  Mail,
  MessageCircle,
  FileText,
  Heart,
} from 'lucide-react';
import { FaDiscord, FaGithub } from 'react-icons/fa';

export default function SupportPage() {
  const { t } = useTranslation();

  const faqs = [
    {
      q: 'How do I generate a CommitPulse badge?',
      a: 'Simply enter your GitHub username on the Generator page. We fetch your real-time contribution data and create a stunning 3D isometric monolith.',
    },
    {
      q: 'Can I customize the badge appearance?',
      a: 'Absolutely. The Customization Studio lets you change colors, themes (Neon, Dracula, etc.), scaling, layout, and more with live preview.',
    },
    {
      q: 'How do I embed the badge in my GitHub README?',
      a: 'Copy the Markdown code provided after generation and paste it into your README.md. It updates automatically with your contributions.',
    },
    {
      q: 'Is CommitPulse free?',
      a: 'Yes, completely free and open source under MIT license.',
    },
    {
      q: 'Why is my streak/contribution not updating?',
      a: 'GitHub can take a few hours to reflect new activity. Also ensure your contributions are set to public in GitHub settings.',
    },
    {
      q: 'Can I self-host CommitPulse?',
      a: 'Yes! Check our Self-Hosting guide in the documentation.',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-lg fixed w-full z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              ⚡ CommitPulse
            </Link>
          </div>

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
            <MessageCircle size={18} />
            SUPPORT CENTER
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            How can we help you today?
          </h1>
          <p className="text-xl text-zinc-400 max-w-lg mx-auto">
            Fast, friendly support for the CommitPulse community.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <a
            href="https://github.com/JhaSourav07/commitpulse/issues/new?template=bug_report.md"
            target="_blank"
            className="group p-8 rounded-3xl border border-white/10 bg-zinc-900 hover:border-red-500/50 hover:bg-zinc-900/70 transition-all hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bug className="text-red-400" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Report a Bug</h3>
            <p className="text-zinc-400">
              Something not working? Let us know so we can fix it quickly.
            </p>
            <div className="mt-6 text-red-400 text-sm flex items-center gap-2">
              Open Bug Report →
            </div>
          </a>

          <a
            href="https://github.com/JhaSourav07/commitpulse/issues/new?template=feature_request.md"
            target="_blank"
            className="group p-8 rounded-3xl border border-white/10 bg-zinc-900 hover:border-amber-500/50 hover:bg-zinc-900/70 transition-all hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lightbulb className="text-amber-400" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Request a Feature</h3>
            <p className="text-zinc-400">
              Have an idea? Share it and help shape the future of CommitPulse.
            </p>
            <div className="mt-6 text-amber-400 text-sm flex items-center gap-2">
              Suggest Feature →
            </div>
          </a>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-16">
            {/* Community */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                  <Users className="text-violet-400" size={24} />
                </div>
                <h2 className="text-3xl font-semibold">Community Support</h2>
              </div>
              <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-8">
                <p className="text-zinc-400 mb-6">
                  Get real-time help from the community and maintainers.
                </p>
                <a
                  href="https://discord.gg/Cb73bS79j"
                  target="_blank"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-medium transition-all"
                >
                  <FaDiscord size={26} />
                  Join our Discord Server
                </a>
                <a
                  href="https://github.com/JhaSourav07/commitpulse/blob/main/CODE_OF_CONDUCT.md"
                  target="_blank"
                  className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-300 underline"
                >
                  Read Community Guidelines →
                </a>
              </div>
            </section>

            {/* Documentation */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-teal-500/10 rounded-2xl flex items-center justify-center">
                  <BookOpen className="text-teal-400" size={24} />
                </div>
                <h2 className="text-3xl font-semibold">Documentation & Help</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="https://github.com/JhaSourav07/commitpulse/blob/main/README.md"
                  target="_blank"
                  className="p-6 bg-zinc-900 border border-white/10 rounded-3xl hover:border-teal-400/40 group"
                >
                  <BookOpen className="mb-4 text-teal-400" size={28} />
                  <div className="font-medium">Full Documentation</div>
                  <div className="text-sm text-zinc-500">
                    Getting started, parameters, self-hosting
                  </div>
                </a>
                <a
                  href="https://github.com/JhaSourav07/commitpulse"
                  target="_blank"
                  className="p-6 bg-zinc-900 border border-white/10 rounded-3xl hover:border-teal-400/40 group"
                >
                  <FaGithub className="mb-4" size={28} />
                  <div className="font-medium">GitHub Repository</div>
                  <div className="text-sm text-zinc-500">Source code, issues & discussions</div>
                </a>
              </div>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="text-3xl font-semibold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group bg-zinc-900 border border-white/10 rounded-3xl px-8 py-6"
                  >
                    <summary className="font-medium cursor-pointer flex justify-between items-center list-none">
                      {faq.q}
                      <span className="text-2xl text-teal-400 group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="mt-6 text-zinc-400 pr-8">{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* Security */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <Shield className="text-emerald-400" size={24} />
                </div>
                <h2 className="text-3xl font-semibold">Security & Responsible Disclosure</h2>
              </div>
              <div className="bg-zinc-900 border border-emerald-500/20 rounded-3xl p-8">
                <p className="text-zinc-400 mb-6">
                  Found a security vulnerability? Please report it privately.
                </p>
                <div className="font-mono bg-black/60 p-4 rounded-2xl border border-white/10 mb-4">
                  security@commitpulse.dev
                </div>
                <p className="text-sm text-zinc-500">
                  See our{' '}
                  <a
                    href="https://github.com/JhaSourav07/commitpulse/blob/main/SECURITY.md"
                    target="_blank"
                    className="underline hover:text-white"
                  >
                    SECURITY.md
                  </a>{' '}
                  for details.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl p-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="text-teal-400" size={20} />
                  Still need help?
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  For private matters or enterprise inquiries.
                </p>
                <a
                  href="mailto:support@commitpulse.dev"
                  className="block w-full text-center py-4 bg-white text-black rounded-2xl font-medium hover:bg-white/90"
                >
                  Email Us
                </a>
              </div>

              <div className="text-center text-xs text-zinc-500 pt-4">
                Thank you for being part of the CommitPulse community 💚
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
