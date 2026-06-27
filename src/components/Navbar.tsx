"use client";

import { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative border-b border-border">
      <div className="flex items-center justify-between px-5 sm:px-8 py-4">
        <Link
          href="/"
          className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2"
          onClick={() => setMenuOpen(false)}
        >
          <span className="w-2 h-2 rounded-full bg-accent inline-block" />
          Pocket Switch
        </Link>

        {/* Desktop nav links — hidden on mobile, replaced by the hamburger below */}
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
          <li>
            <Link
              href="/badge"
              className="hover:text-foreground transition-colors"
            >
              Get Badge
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="https://docs.pocket.network/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-[13px] font-display font-medium transition-colors"
          >
            View Docs
          </a>

          {/* Hamburger toggle — visible only below md, where the link list is hidden */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-lighter hover:text-foreground hover:border-border-hover transition-colors"
          >
            {menuOpen ? (
              <span className="text-base leading-none">✕</span>
            ) : (
              <span className="text-base leading-none">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu — only rendered below md, toggled by the hamburger */}
      {menuOpen && (
        <ul className="md:hidden flex flex-col gap-1 px-5 pb-4 text-sm text-muted-lighter border-t border-border bg-background">
          <li>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 hover:text-foreground transition-colors"
            >
              Converter
            </Link>
          </li>
          <li>
            <Link
              href="/chains"
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 hover:text-foreground transition-colors"
            >
              Chains
            </Link>
          </li>
          <li>
            <Link
              href="/why"
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 hover:text-foreground transition-colors"
            >
              Why Switch?
            </Link>
          </li>
          <li>
            <Link
              href="/badge"
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 hover:text-foreground transition-colors"
            >
              Get Badge
            </Link>
          </li>
          <li>
            <a
              href="https://docs.pocket.network/developers"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 hover:text-foreground transition-colors"
            >
              View Docs ↗
            </a>
          </li>
        </ul>
      )}
    </nav>
  );
}
