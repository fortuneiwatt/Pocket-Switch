"use client";

import { useState, useEffect, useCallback } from "react";
import { detectAllChains } from "@/lib/parser";
import {
  generateAllSnippets,
  ALL_FRAMEWORKS,
  type GeneratedSnippet,
} from "@/lib/generator";
import { highlightCode } from "@/lib/highlight";
import { testPocketEndpoint, type EndpointTestResult } from "@/lib/testEndpoint";
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
  const [allDetections, setAllDetections] = useState<DetectionResult[]>([]);
  const [activeChainId, setActiveChainId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FrameworkId>("ethers");
  const [snippets, setSnippets] = useState<Record<
    FrameworkId,
    GeneratedSnippet
  > | null>(null);
  const [highlighted, setHighlighted] = useState<Record<string, string>>({});
  const [copiedTab, setCopiedTab] = useState<FrameworkId | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testResult, setTestResult] = useState<EndpointTestResult>({
    status: "idle",
  });

  // The currently selected detection result — defaults to the first chain
  // found, and switches when the person clicks a different chip in a
  // multi-chain result.
  const detection =
    allDetections.find((d) => d.chain.id === activeChainId) ??
    allDetections[0] ??
    null;

  const runConversion = useCallback(() => {
    const results = detectAllChains(input);
    if (results.length === 0) {
      setAllDetections([]);
      setActiveChainId(null);
      setSnippets(null);
      setNotFound(input.trim().length > 0);
      setTestResult({ status: "idle" });
      return;
    }
    setNotFound(false);
    setAllDetections(results);
    setActiveChainId(results[0].chain.id);
    setSnippets(generateAllSnippets(results[0].chain));
    setTestResult({ status: "idle" }); // reset any previous test when a new chain is detected
  }, [input]);

  function selectChain(chainId: string) {
    const found = allDetections.find((d) => d.chain.id === chainId);
    if (!found) return;
    setActiveChainId(chainId);
    setSnippets(generateAllSnippets(found.chain));
    setTestResult({ status: "idle" }); // reset test result when switching chains
  }

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

  async function handleTestEndpoint() {
    if (!detection) return;
    setTestResult({ status: "loading" });
    const result = await testPocketEndpoint(detection.chain);
    setTestResult(result);
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
          placeholder={`https://mainnet.infura.io/v3/YOUR_KEY\n// or paste a full multi-chain config — every chain found gets converted\nconst provider = new JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/KEY")`}
          className="w-full min-h-[140px] bg-transparent border-none outline-none p-5 font-mono-code text-[13px] text-foreground/90 resize-none leading-relaxed placeholder:text-border-hover"
          spellCheck={false}
        />

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-raised">
          <span className="text-xs text-muted font-mono-code">
            Supports: Infura · Alchemy · QuickNode · multi-chain paste
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
              {allDetections.length > 1
                ? `Detected ${allDetections.length} chains`
                : "Detected"}
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

      {/* Multi-chain selector — only appears when the paste contained more
          than one distinct chain (e.g. a multi-chain wagmi config or a
          .env file listing several networks). Clicking a chip swaps which
          chain's detail view (endpoint, code, test button) is shown below,
          reusing all of the same UI as the single-chain case. */}
      {allDetections.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {allDetections.map((d) => (
            <button
              key={d.chain.id}
              onClick={() => selectChain(d.chain.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-display font-medium border transition-colors",
                d.chain.id === detection.chain.id
                  ? "bg-accent text-white border-accent"
                  : "bg-surface border-border text-muted-lighter hover:border-border-hover hover:text-foreground"
              )}
            >
              {d.chain.name}
            </button>
          ))}
        </div>
      )}

      {/* Output */}
      {snippets && detection && (
        <div className="mt-4 bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Prominent Pocket endpoint callout — makes the actual Pocket Network
              usage impossible to miss, independent of syntax highlighting.
              Includes a live "Test Endpoint" button that fires a real
              JSON-RPC request at the actual Pocket URL, proving it's not
              just text on screen. */}
          <div className="border-b border-success-border bg-success-bg">
            <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="w-7 h-7 rounded-md bg-success/15 flex items-center justify-center text-sm flex-shrink-0">
                ⬡
              </div>
              <div className="flex-1 min-w-0 basis-full sm:basis-0">
                <div className="text-[10px] text-success-text/70 uppercase tracking-wide font-display mb-0.5">
                  Pocket Network Endpoint
                </div>
                <div className="font-mono-code text-[13px] text-success-text font-medium break-all sm:truncate">
                  {detection.chain.pocketUrl}
                </div>
              </div>
              <button
                onClick={handleTestEndpoint}
                disabled={testResult.status === "loading"}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-display font-medium border transition-colors flex items-center gap-1.5",
                  testResult.status === "loading"
                    ? "border-success-border text-success-text/60 cursor-wait"
                    : "border-success-border text-success-text hover:bg-success/10"
                )}
              >
                {testResult.status === "loading" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-success-text/40 border-t-success-text animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>▶ Test Endpoint</>
                )}
              </button>
            </div>

            {/* Live result — only shown after a test has been run */}
            {testResult.status === "success" && (
              <div className="px-5 pb-3.5 -mt-1 flex items-center gap-2 text-[12px] font-mono-code">
                <span className="text-success-text font-semibold">
                  ✓ Live: {testResult.message}
                </span>
                <span className="text-success-text/60">
                  · {testResult.latencyMs}ms
                </span>
              </div>
            )}
            {testResult.status === "error" && (
              <div className="px-5 pb-3.5 -mt-1 flex items-center gap-2 text-[12px] font-mono-code">
                <span className="text-danger font-semibold">
                  ✕ {testResult.message}
                </span>
                {testResult.latencyMs !== undefined && (
                  <span className="text-success-text/40">
                    · {testResult.latencyMs}ms
                  </span>
                )}
              </div>
            )}
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
