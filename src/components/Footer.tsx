export function Footer() {
  return (
    <footer className="bg-surface-raised border-t border-border px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      <div className="font-display font-bold text-muted">⬡ Pocket Switch</div>
      <div className="text-xs text-border-hover font-mono-code">
        Built for the Built On Pocket Hackathon · June 2026
      </div>
      <a
        href="https://docs.pocket.network"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-border-hover font-mono-code hover:text-muted transition-colors"
      >
        docs.pocket.network
      </a>
    </footer>
  );
}
