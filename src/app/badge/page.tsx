"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type BadgeStyle = "flat" | "flat-square" | "plastic" | "for-the-badge";

const STYLE_OPTIONS: { id: BadgeStyle; label: string }[] = [
  { id: "flat", label: "Flat" },
  { id: "flat-square", label: "Flat Square" },
  { id: "plastic", label: "Plastic" },
  { id: "for-the-badge", label: "For The Badge" },
];

const LABEL_TEXT = "Powered by";
const MESSAGE_TEXT = "Pocket Network";
const BADGE_COLOR = "10b981"; // matches our success/accent green, hex without '#'

function buildBadgeUrl(style: BadgeStyle): string {
  const label = encodeURIComponent(LABEL_TEXT).replace(/%20/g, "_");
  const message = encodeURIComponent(MESSAGE_TEXT).replace(/%20/g, "_");
  return `https://img.shields.io/badge/${label}-${message}-${BADGE_COLOR}?style=${style}`;
}

export default function BadgePage() {
  const [style, setStyle] = useState<BadgeStyle>("flat");
  const [copiedFormat, setCopiedFormat] = useState<"markdown" | "html" | null>(
    null
  );

  const badgeUrl = useMemo(() => buildBadgeUrl(style), [style]);
  const linkUrl = "https://pocket-switch.onrender.com";

  const markdownSnippet = `[![Powered by Pocket Network](${badgeUrl})](${linkUrl})`;
  const htmlSnippet = `<a href="${linkUrl}"><img src="${badgeUrl}" alt="Powered by Pocket Network" /></a>`;

  function copy(format: "markdown" | "html") {
    const text = format === "markdown" ? markdownSnippet : htmlSnippet;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    });
  }

  return (
    <div className="px-6 py-12 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-white mb-1.5">
        Get a badge
      </h1>
      <p className="text-muted-lighter text-sm mb-10 max-w-xl">
        Switched your project to Pocket Network? Add a badge to your README
        so other developers browsing your repo know — and discover Pocket
        Network themselves.
      </p>

      {/* Live preview */}
      <div className="bg-surface border border-border rounded-2xl px-6 py-10 flex items-center justify-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badgeUrl}
          alt="Powered by Pocket Network badge preview"
          className="h-auto"
        />
      </div>

      {/* Style picker */}
      <div className="mb-8">
        <div className="text-[11px] font-display font-semibold text-muted uppercase tracking-wider mb-3">
          Style
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStyle(opt.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-display font-medium border transition-colors",
                style === opt.id
                  ? "bg-accent text-white border-accent"
                  : "bg-surface border-border text-muted-lighter hover:border-border-hover hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Markdown snippet */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-raised">
          <span className="text-xs font-display font-medium text-muted uppercase tracking-wide">
            Markdown — for README.md
          </span>
          <button
            onClick={() => copy("markdown")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-display border transition-colors",
              copiedFormat === "markdown"
                ? "bg-success-bg border-success-border text-success-text"
                : "bg-surface-raised border-border-hover text-muted-lighter hover:text-foreground"
            )}
          >
            {copiedFormat === "markdown" ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <code className="font-mono-code text-[13px] text-foreground/80 whitespace-pre">
            {markdownSnippet}
          </code>
        </div>
      </div>

      {/* HTML snippet */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-10">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-raised">
          <span className="text-xs font-display font-medium text-muted uppercase tracking-wide">
            HTML — for sites that don&apos;t render markdown
          </span>
          <button
            onClick={() => copy("html")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-display border transition-colors",
              copiedFormat === "html"
                ? "bg-success-bg border-success-border text-success-text"
                : "bg-surface-raised border-border-hover text-muted-lighter hover:text-foreground"
            )}
          >
            {copiedFormat === "html" ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <code className="font-mono-code text-[13px] text-foreground/80 whitespace-pre">
            {htmlSnippet}
          </code>
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed max-w-xl">
        The badge image is generated live by{" "}
        <a
          href="https://shields.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-text hover:underline"
        >
          shields.io
        </a>{" "}
        — it&apos;s a real, hosted image, not a static screenshot, so it
        always renders correctly wherever you paste it.
      </p>
    </div>
  );
}
