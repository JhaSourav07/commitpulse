import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | CommitPulse',
  description:
    'Learn how CommitPulse collects, uses, and protects your data when you use our GitHub analytics platform.',
};

export default function PrivacyPage() {
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
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Privacy Policy
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Your Privacy Matters
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
            CommitPulse is built for developers, by developers. Here&apos;s exactly what data we
            collect, why we collect it, and how we protect it.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">Last updated: July 2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <section
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 
          hover:border-gray-300 dark:hover:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                1
              </span>
              Information We Collect
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              When you sign in with GitHub, we access the following information via GitHub OAuth:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Your public GitHub profile (username, avatar, bio)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Your public repositories and commit history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Your email address (if public on GitHub)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Basic usage data such as pages visited and features used</span>
              </li>
            </ul>
          </section>

          <section
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 
          hover:border-gray-300 dark:hover:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                2
              </span>
              How We Use Your Data
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>To generate your commit analytics, streaks, and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>To power features like burnout analysis and README generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>To improve platform performance and fix bugs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>We never sell your data to third parties</span>
              </li>
            </ul>
          </section>

          <section
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 
          hover:border-gray-300 dark:hover:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                3
              </span>
              Data Storage & Security
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Your data is stored securely using industry-standard encryption. GitHub OAuth tokens
              are stored only for the duration of your session and are never logged or shared. We
              use secure HTTPS connections for all data transmission.
            </p>
          </section>

          <section
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 
          hover:border-gray-300 dark:hover:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                4
              </span>
              Third Party Services
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              CommitPulse uses GitHub OAuth for authentication. By signing in, you also agree to{' '}
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 dark:text-blue-400 hover:underline"
              >
                GitHub&apos;s Privacy Policy
              </a>
              . We do not use any advertising or tracking third-party services.
            </p>
          </section>

          <section
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 
          hover:border-gray-300 dark:hover:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                5
              </span>
              Your Rights
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>You may request access to your personal data at any time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>You may request deletion of your account and associated data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>
                  You can revoke GitHub OAuth access at any time from your GitHub settings
                </span>
              </li>
            </ul>
          </section>

          <section
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 
          hover:border-gray-300 dark:hover:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                6
              </span>
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may update this Privacy Policy from time to time. Continued use of CommitPulse
              after changes implies acceptance of the updated policy. Please review this page
              periodically.
            </p>
          </section>

          <section
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 
          hover:border-gray-300 dark:hover:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                7
              </span>
              Contact
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have any questions about this Privacy Policy, please reach out via{' '}
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
          <Link href="/terms" className="text-sm text-blue-500 dark:text-blue-400 hover:underline">
            Terms of Use →
          </Link>
        </div>
      </div>
    </main>
  );
}
