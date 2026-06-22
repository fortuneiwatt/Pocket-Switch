"use client";

import { useState, useEffect, useCallback } from "react";
import { detectChain } from "@/lib/parser";
import {
  generateAllSnippets,
  ALL_FRAMEWORKS,
  type GeneratedSnippet,
} from "@/lib/generator";
import { highlightCode } from "@/lib/highlight";
import type { DetectionResult, FrameworkId } from "@/lib/types";
import { cn } from "@/lib/utils";

const FRAMEWORK_TAB_LABELS: Record<FrameworkId, string> = {
  ethers: "ethers.js",
  viem: "viem",
  wagmi: "wagmi",
  web3py: "web3.py",
  curl: "curl",
};

export function Converter() {
  const [input, setInput] = useState("");
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [activeTab, setActiveTab] = useState<FrameworkId>("ethers");
  const [snippets, setSnippets] = useState<Record<
    FrameworkId,
    GeneratedSnippet
  > | null>(null);
  const [highlighted, setHighlighted] = useState<Record<string, string>>({});
  const [copiedTab, setCopiedTab] = useState<FrameworkId | null>(null);
  const [notFound, setNotFound] = useState(false);

  const runConversion = useCallback(() => {
    const result = detectChain(input);
    if (!result) {
      setDetection(null);
      setSnippets(null);
      setNotFound(input.trim().length > 0);
      return;
    }
    setNotFound(false);
    setDetection(result);
    setSnippets(generateAllSnippets(result.chain));
  }, [input]);

  // Re-highlight whenever the active tab's snippet changes
  useEffect(() => {
    if (!snippets) return;
    const snippet = snippets[activeTab];
    let cancelled = false;
    highlightCode(snippet.code, snippet.language).then((html) => {
      if (!cancelled) {
        setHighlighted((prev) => ({ ...prev, [activeTab]: html }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [snippets, activeTab]);

  function handleCopy(framework: FrameworkId) {
    if (!snippets) return;
    navigator.clipboard.writeText(snippets[framework].code).then(() => {
      setCopiedTab(framework);
      setTimeout(() => setCopiedTab(null), 2000);
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pb-16">
      {/* Input card */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-raised">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
          </div>
          <span className="text-xs font-display font-medium text-muted uppercase tracking-wide">
            Paste your code or URL
          </span>
          <span />
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`https://mainnet.infura.io/v3/YOUR_KEY\n// or paste a full code snippet\nconst provider = new JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/KEY")`}
          className="w-full min-h-[140px] bg-transparent border-none outline-none p-5 font-mono-code text-[13px] text-foreground/90 resize-none leading-relaxed placeholder:text-border-hover"
          spellCheck={false}
        />

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-raised">
          <span className="text-xs text-muted font-mono-code">
            Supports: Infura · Alchemy · QuickNode
          </span>
          <button
            onClick={runConversion}
            disabled={!input.trim()}
            className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-display font-semibold transition-colors flex items-center gap-2"
          >
            Convert <span>→</span>
          </button>
        </div>
      </div>

      {/* Not found state */}
      {notFound && (
        <div className="mt-4 bg-surface border border-danger/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-sm flex-shrink-0">
            ⚠
          </div>
          <p className="text-sm text-muted-lighter">
            Couldn&apos;t detect a known provider in that input. Try pasting
            a full Infura, Alchemy, or QuickNode RPC URL.
          </p>
        </div>
      )}

      {/* Detection badge */}
      {detection && (
        <div className="mt-4 bg-surface border border-accent-soft rounded-xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center text-sm flex-shrink-0">
            ✓
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-muted uppercase tracking-wide font-display mb-0.5">
              Detected
            </div>
            <div className="font-display text-sm font-semibold text-accent-text">
              {detection.providerLabel}
            </div>
          </div>
          <div className="bg-surface-raised border border-accent-soft rounded-md px-2.5 py-1 text-xs text-accent-text font-display font-medium">
            {detection.chain.name}
          </div>
        </div>
      )}

      {/* Output */}
      {snippets && detection && (
        <div className="mt-4 bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Prominent Pocket endpoint callout — makes the actual Pocket Network
              usage impossible to miss, independent of syntax highlighting */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-success-border bg-success-bg">
            <div className="w-7 h-7 rounded-md bg-success/15 flex items-center justify-center text-sm flex-shrink-0">
              ⬡
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-success-text/70 uppercase tracking-wide font-display mb-0.5">
                Pocket Network Endpoint
              </div>
              <div className="font-mono-code text-[13px] text-success-text font-medium truncate">
                {detection.chain.pocketUrl}
              </div>
            </div>
          </div>

          <div className="flex border-b border-border bg-surface-raised overflow-x-auto">
            {ALL_FRAMEWORKS.map((fw) => (
              <button
                key={fw}
                onClick={() => setActiveTab(fw)}
                className={cn(
                  "px-5 py-3 text-[13px] font-display font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === fw
                    ? "text-accent-text border-accent"
                    : "text-muted border-transparent hover:text-muted-lighter"
                )}
              >
                {FRAMEWORK_TAB_LABELS[fw]}
              </button>
            ))}
          </div>

          <div className="relative px-5 py-6">
            <button
              onClick={() => handleCopy(activeTab)}
              className={cn(
                "absolute top-4 right-4 px-3 py-1.5 rounded-md text-xs font-display border transition-colors",
                copiedTab === activeTab
                  ? "bg-success-bg border-success-border text-success-text"
                  : "bg-surface-raised border-border-hover text-muted-lighter hover:text-foreground"
              )}
            >
              {copiedTab === activeTab ? "Copied" : "Copy"}
            </button>
            <div
              className="overflow-x-auto [&_pre]:!bg-transparent [&_pre]:!p-0"
              dangerouslySetInnerHTML={{
                __html:
                  highlighted[activeTab] ??
                  `<pre class="font-mono-code text-[13px] text-foreground/80">${snippets[activeTab].code}</pre>`,
              }}
            />
          </div>

          <div className="flex items-center gap-3 px-5 py-3.5 border-t border-success-border bg-success-bg">
            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-[10px] text-white flex-shrink-0">
              ✓
            </div>
            <span className="text-[13px] text-success-text font-display">
              Ready — {detection.chain.name} via Pocket Network. No API key
              needed.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
