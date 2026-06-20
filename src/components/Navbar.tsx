import Link from "next/link";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
      <Link
        href="/"
        className="font-display text-xl font-bold text-white flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-accent inline-block" />
        Pocket Switch
      </Link>
      <ul className="hidden md:flex gap-6 text-sm text-muted-lighter">
        <li>
          <Link href="/" className="hover:text-foreground transition-colors">
            Converter
          </Link>
        </li>
        <li>
          <Link
            href="/chains"
            className="hover:text-foreground transition-colors"
          >
            Chains
          </Link>
        </li>
        <li>
          <Link
            href="/why"
            className="hover:text-foreground transition-colors"
          >
            Why Switch?
          </Link>
        </li>
      </ul>
      <a
        href="https://docs.pocket.network/developers"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-[13px] font-display font-medium transition-colors"
      >
        View Docs
      </a>
    </nav>
  );
}
