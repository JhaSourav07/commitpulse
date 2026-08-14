'use client';

import { useTranslation } from '@/context/TranslationContext';
import { Bug, Lightbulb, Users, BookOpen, Shield, Mail, MessageCircle } from 'lucide-react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { Footer } from '../components/Footer';

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
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0a0a0a] dark:text-white">
      <div className="pt-8 pb-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 font-medium text-emerald-600 dark:text-emerald-400 rounded-full text-sm mb-5">
            <MessageCircle size={18} />
            SUPPORT CENTER
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            How can we help you today?
          </h1>
          <p className="text-xl text-gray-500 dark:text-white/40 max-w-lg mx-auto">
            Fast, friendly support for the CommitPulse community.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <a
            href="https://github.com/JhaSourav07/commitpulse/issues/new?template=bug_report.md"
            target="_blank"
            className="group p-8 rounded-3xl border border-gray-200 bg-white shadow-sm transition-shadow hover:border-black/20 hover:shadow-md hover:-translate-y-1 dark:hover:border-[rgba(255,255,255,0.14)] dark:border-white/10 dark:bg-[#111111] dark:shadow-none"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bug className="text-red-500 dark:text-red-400" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Report a Bug</h3>
            <p className="text-gray-500 dark:text-white/40">
              Something not working? Let us know so we can fix it quickly.
            </p>
            <div className="mt-6 text-red-500 dark:text-red-400 text-sm flex items-center gap-2">
              Open Bug Report →
            </div>
          </a>

          <a
            href="https://github.com/JhaSourav07/commitpulse/issues/new?template=feature_request.md"
            target="_blank"
            className="group p-8 rounded-3xl border border-gray-200 bg-white shadow-sm transition-shadow hover:border-black/20 hover:shadow-md hover:-translate-y-1 dark:hover:border-[rgba(255,255,255,0.14)] dark:border-white/10 dark:bg-[#111111] dark:shadow-none"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lightbulb className="text-amber-500 dark:text-amber-400" size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Request a Feature</h3>
            <p className="text-gray-500 dark:text-white/40">
              Have an idea? Share it and help shape the future of CommitPulse.
            </p>
            <div className="mt-6 text-amber-500 dark:text-amber-400 text-sm flex items-center gap-2">
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
                  <Users className="text-violet-500 dark:text-violet-400" size={24} />
                </div>
                <h2 className="text-3xl font-semibold">Community Support</h2>
              </div>
              <div className="border border-gray-200 bg-white rounded-3xl p-8 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#111111] dark:shadow-none">
                <p className="text-gray-500 dark:text-white/40 mb-6">
                  Get real-time help from the community and maintainers.
                </p>
                <a
                  href="https://discord.gg/f84SDraEBH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-medium text-white transition-all"
                >
                  <FaDiscord size={26} />
                  Join our Discord Server
                </a>
                <a
                  href="https://github.com/JhaSourav07/commitpulse/blob/main/CODE_OF_CONDUCT.md"
                  target="_blank"
                  className="mt-4 ml-6 inline-block text-sm text-gray-500 hover:text-gray-700 underline dark:text-white/40 dark:hover:text-zinc-300"
                >
                  Read Community Guidelines →
                </a>
              </div>
            </section>

            {/* Documentation */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <BookOpen className="text-emerald-600 dark:text-emerald-400" size={24} />
                </div>
                <h2 className="text-3xl font-semibold">Documentation & Help</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="https://github.com/JhaSourav07/commitpulse/blob/main/README.md"
                  target="_blank"
                  className="p-6 border border-gray-200 bg-white rounded-3xl group shadow-sm transition-shadow hover:border-black/20 hover:shadow-md hover:-translate-y-1 dark:hover:border-[rgba(255,255,255,0.14)] dark:border-white/10 dark:bg-[#111111] dark:shadow-none"
                >
                  <BookOpen className="mb-4 text-emerald-600 dark:text-emerald-400" size={28} />
                  <div className="font-medium">Full Documentation</div>
                  <div className="text-sm text-gray-500 dark:text-white/40">
                    Getting started, parameters, self-hosting
                  </div>
                </a>
                <a
                  href="https://github.com/JhaSourav07/commitpulse"
                  target="_blank"
                  className="p-6 border border-gray-200 bg-white rounded-3xl group shadow-sm transition-shadow hover:border-black/20 hover:shadow-md hover:-translate-y-1 dark:hover:border-[rgba(255,255,255,0.14)] dark:border-white/10 dark:bg-[#111111] dark:shadow-none"
                >
                  <FaGithub className="mb-4" size={28} />
                  <div className="font-medium">GitHub Repository</div>
                  <div className="text-sm text-gray-500 dark:text-white/40">
                    Source code, issues & discussions
                  </div>
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
                    className="group border border-gray-200 bg-white rounded-3xl px-8 py-6 dark:border-white/10 dark:bg-[#111111] dark:shadow-none"
                  >
                    <summary className="font-medium cursor-pointer flex justify-between items-center list-none">
                      {faq.q}
                      <span className="text-2xl text-emerald-600 dark:text-emerald-400 group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="mt-6 text-gray-500 dark:text-muted-foreground pr-8">{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* Security */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <Shield className="text-emerald-600 dark:text-emerald-400" size={24} />
                </div>
                <h2 className="text-3xl font-semibold">Security & Responsible Disclosure</h2>
              </div>
              <div className="border border-gray-200 bg-white rounded-3xl p-8 shadow-sm transition-shadow hover:shadow-md dark:bg-[#111111] dark:border-white/10 dark:shadow-none">
                <p className="text-gray-500 dark:text-white/40 mb-6">
                  Found a security vulnerability? Please report it privately.
                </p>
                <div className="font-mono bg-gray-100 p-4 rounded-2xl border border-gray-200 mb-4 dark:bg-black/60 dark:border-white/10">
                  security@commitpulse.dev
                </div>
                <p className="text-sm text-gray-500 dark:text-white/40">
                  See our{' '}
                  <a
                    href="https://github.com/JhaSourav07/commitpulse/blob/main/SECURITY.md"
                    target="_blank"
                    className="underline hover:text-gray-700 dark:hover:text-white"
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
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm transition-shadow hover:shadow-md dark:bg-[#111111] dark:border-white/10 dark:shadow-none">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="text-emerald-600 dark:text-emerald-400" size={20} />
                  Still need help?
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/40 mb-6">
                  For private matters or enterprise inquiries.
                </p>
                <a
                  href="mailto:support@commitpulse.dev"
                  className="block w-full text-center py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 hover:-translate-y-0.5 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Email Us
                </a>
              </div>

              <div className="text-center text-xs text-gray-400 dark:text-zinc-500 pt-4">
                Thank you for being part of the CommitPulse community 💚
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-8">
        <Footer />
      </div>
    </div>
  );
}
