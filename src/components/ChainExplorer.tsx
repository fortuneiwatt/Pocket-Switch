"use client";

import { useState, useMemo } from "react";
import { ALL_CHAINS } from "@/lib/parser";
import type { ChainEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

function ChainCard({ chain }: { chain: ChainEntry }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(chain.pocketUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-border-hover transition-colors">
      <div className="flex-1 min-w-0">
        <div className="font-display text-sm font-semibold text-foreground mb-0.5">
          {chain.name}
        </div>
        <div className="font-mono-code text-[11px] text-muted truncate">
          {chain.pocketUrl}
        </div>
      </div>
      <button
        onClick={handleCopy}
        title="Copy endpoint"
        className={cn(
          "ml-3 flex-shrink-0 w-8 h-8 rounded-md border flex items-center justify-center text-xs transition-colors",
          copied
            ? "bg-success-bg border-success-border text-success-text"
            : "border-border text-muted hover:text-foreground hover:border-border-hover"
        )}
      >
        {copied ? "✓" : "⧉"}
      </button>
    </div>
  );
}

export function ChainExplorer() {
  const [query, setQuery] = useState("");
  const [showTestnets, setShowTestnets] = useState(false);

  const visibleChains = useMemo(
    () => (showTestnets ? ALL_CHAINS : ALL_CHAINS.filter((c) => !c.isTestnet)),
    [showTestnets]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleChains;
    return visibleChains.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [visibleChains, query]);

  const groups: { label: string; chains: ChainEntry[] }[] = useMemo(() => {
    const evm = filtered.filter((c) => !c.rpcType || c.rpcType === "evm");
    const cosmos = filtered.filter((c) => c.rpcType === "cosmos");
    const other = filtered.filter(
      (c) => c.rpcType && c.rpcType !== "evm" && c.rpcType !== "cosmos"
    );
    return [
      { label: "EVM networks", chains: evm },
      { label: "Cosmos ecosystem", chains: cosmos },
      { label: "Other networks", chains: other },
    ].filter((g) => g.chains.length > 0);
  }, [filtered]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chains..."
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors placeholder:text-border-hover"
        />
        <label className="flex items-center gap-2 text-sm text-muted-lighter cursor-pointer select-none px-1">
          <input
            type="checkbox"
            checked={showTestnets}
            onChange={(e) => setShowTestnets(e.target.checked)}
            className="accent-accent"
          />
          Show testnets
        </label>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted text-sm text-center py-12">
          No chains match &ldquo;{query}&rdquo;.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.label} className="mb-8">
          <div className="text-[11px] font-display font-semibold text-muted uppercase tracking-wider mb-3">
            {group.label}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {group.chains.map((chain) => (
              <ChainCard key={chain.id} chain={chain} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
