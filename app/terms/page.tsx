import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | CommitPulse',
  description:
    'Terms and conditions for using CommitPulse, the GitHub contribution analytics and visualization platform.',
};

const cardClass =
  'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 hover:border-gray-300 dark:hover:border-gray-700';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mb-8"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="inline-flex items-center gap-2 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
                clipRule="evenodd"
              />
            </svg>
            Terms of Use
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms of Use</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
            CommitPulse turns your GitHub contribution history into a cinematic SVG monolith. By
            using our platform, you agree to the terms below.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">Last updated: July 2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                1
              </span>
              Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              By accessing or using CommitPulse, including generating a badge, viewing a dashboard,
              or embedding our SVG in your GitHub profile README you agree to be bound by these
              Terms of Use. If you do not agree, please discontinue use of the platform.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                2
              </span>
              Use of the Platform
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              CommitPulse provides GitHub contribution analytics, streak tracking, and customizable
              SVG badge generation via our public API and dashboard. When using the platform, you
              agree to:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Use CommitPulse only for lawful purposes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>
                  Not attempt to abuse, overload, or reverse-engineer the badge-generation API or
                  GraphQL integration
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>
                  Not use the platform to misrepresent GitHub contribution data belonging to another
                  user
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Respect GitHub API rate limits when self-hosting your own instance</span>
              </li>
            </ul>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                3
              </span>
              Self-Hosting & API Tokens
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              CommitPulse supports self-hosted deployment using your own GitHub Personal Access
              Token. You are solely responsible for keeping your token secure, using the minimum
              required scope (
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                read:user
              </code>
              ), and never committing it to a public repository. CommitPulse is not responsible for
              tokens exposed due to improper local setup.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                4
              </span>
              Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              CommitPulse is open source and licensed under the MIT License. You are free to use,
              modify, and self-host the project in accordance with that license. Generated SVG
              badges reflect your own public GitHub data and may be freely embedded in your profile
              README or elsewhere. The CommitPulse name, branding, and theme gallery remain the
              property of the project maintainers.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                5
              </span>
              Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              CommitPulse is provided &quot;as is,&quot; without warranties of any kind. We do not
              guarantee uninterrupted availability, perfectly real-time accuracy of GitHub
              contribution data, or error-free rendering across all themes and configurations. We
              are not liable for any loss or damage arising from reliance on badge data, dashboard
              analytics, or third-party GraphQL/API availability.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                6
              </span>
              Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to restrict or discontinue access to the hosted CommitPulse
              platform for any user found abusing the API, violating these terms, or engaging in
              activity that disrupts service for others. Self-hosted instances are entirely under
              your own control and not subject to this section.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                7
              </span>
              Changes to These Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may revise these Terms of Use as CommitPulse evolves including as new themes, view
              modes, or API parameters are added. Continued use of the platform after changes are
              posted constitutes acceptance of the updated terms. Please check this page
              periodically.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                8
              </span>
              Contact
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have questions about these Terms of Use, please reach out via{' '}
              <Link href="/support" className="text-blue-500 dark:text-blue-400 hover:underline">
                our support page
              </Link>{' '}
              or open an issue on{' '}
              <a
                href="https://github.com/JhaSourav07/commitpulse/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 dark:text-blue-400 hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © 2026 CommitPulse. All rights reserved.
          </p>
          <Link
            href="/privacy"
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            ← Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
