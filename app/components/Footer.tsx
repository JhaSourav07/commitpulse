import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/5 pt-8 text-sm text-white/30">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        {/* LEFT */}
        <p className="text-center md:text-left">
          © 2026 CommitPulse. Designed for the elite builder community.
        </p>

        {/* RIGHT */}
        <div className="flex items-center gap-8">
          <Link href="/contributors" className="transition-colors hover:text-white">
            Contributors
          </Link>

          <a
            href="https://github.com/JhaSourav07/commitpulse/blob/main/README.md"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            Documentation
          </a>

          <a
            href="https://github.com/jhasourav07"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            Creator
          </a>
        </div>
      </div>
    </footer>
  );
}
