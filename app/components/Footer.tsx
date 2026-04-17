export function Footer() {
  return (
    <footer className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/30">
      <p>© 2026 CommitPulse. Designed for the elite builder community.</p>
      <div className="flex gap-8">
        <a
          href="https://github.com/JhaSourav07/commitpulse/blob/main/README.md"
          className="hover:text-white transition-colors"
        >
          Documentation
        </a>
        <a href="https://github.com/jhasourav07" className="hover:text-white transition-colors">
          Creator
        </a>
      </div>
    </footer>
  );
}