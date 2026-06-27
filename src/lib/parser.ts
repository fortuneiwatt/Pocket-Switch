import chainsData from "./chains.json";
import type { ChainEntry, ChainsData, DetectionResult } from "./types";

const data = chainsData as unknown as ChainsData;

/**
 * Flat list of every chain across all categories.
 * Built once at module load — this is the dataset the parser searches against.
 */
export const ALL_CHAINS: ChainEntry[] = [
  ...data.evm,
  ...data.cosmos,
  ...data.other,
  ...data.testnets,
];

/**
 * Non-testnet chains only — used for the Chain Explorer default view
 * and as the fallback chain when detection finds a provider but no chain match.
 */
export const MAINNET_CHAINS: ChainEntry[] = ALL_CHAINS.filter(
  (c) => !c.isTestnet
);

const DEFAULT_CHAIN: ChainEntry =
  MAINNET_CHAINS.find((c) => c.id === "ethereum") ?? MAINNET_CHAINS[0];

/**
 * Internal: finds every (chain, provider, pattern, position) match in the
 * input, without any deduplication. This is the raw building block both
 * detectChain (single best match) and detectAllChains (every distinct
 * chain present) are built on top of.
 */
interface RawMatch {
  chain: ChainEntry;
  providerName: string;
  providerLabel: string;
  matchedPattern: string;
  /** Index in the lowercased haystack where this pattern starts */
  index: number;
}

function findAllMatches(haystack: string): RawMatch[] {
  const matches: RawMatch[] = [];

  for (const chain of ALL_CHAINS) {
    for (const [providerName, providerData] of Object.entries(
      chain.providers
    )) {
      for (const pattern of providerData.patterns) {
        const lowerPattern = pattern.toLowerCase();
        let fromIndex = 0;
        // Find every occurrence of this pattern, not just the first — a
        // single chain's URL could legitimately appear more than once in
        // a pasted file (e.g. repeated across multiple config blocks).
        let idx = haystack.indexOf(lowerPattern, fromIndex);
        while (idx !== -1) {
          matches.push({
            chain,
            providerName,
            providerLabel: providerData.label,
            matchedPattern: pattern,
            index: idx,
          });
          fromIndex = idx + 1;
          idx = haystack.indexOf(lowerPattern, fromIndex);
        }
      }
    }
  }

  return matches;
}

/**
 * Scans pasted input (a raw URL or a full code snippet) and tries to identify:
 *  1. Which provider it belongs to (Infura / Alchemy / QuickNode)
 *  2. Which chain it points at (Ethereum / Polygon / etc.)
 *
 * Strategy: walk every chain's provider pattern list and test substring
 * matches against the lowercased input, collecting ALL matches rather than
 * returning the first one found. We then pick the LONGEST matching pattern.
 *
 * Why longest-match-wins matters: many providers use predictable subdomain
 * conventions like "{chain}-mainnet.infura.io/v3/". A loose pattern for one
 * chain (e.g. just "mainnet.infura.io/v3/" for Ethereum) is a substring of
 * every other chain's URL too (e.g. "arbitrum-mainnet.infura.io/v3/"). If we
 * matched on first-found-in-array-order, Ethereum could falsely "win" against
 * every other Infura chain depending on array position. Longest-match-wins
 * fixes this generally, without requiring every pattern to be hand-checked
 * for accidental overlap as new chains are added.
 */
export function detectChain(input: string): DetectionResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const haystack = trimmed.toLowerCase();
  const rawMatches = findAllMatches(haystack);

  let best: RawMatch | null = null;
  for (const match of rawMatches) {
    if (!best || match.matchedPattern.length > best.matchedPattern.length) {
      best = match;
    }
  }

  if (best) {
    return {
      chain: best.chain,
      providerName: best.providerName,
      providerLabel: best.providerLabel,
      matchedPattern: best.matchedPattern,
    };
  }

  // No chain-specific match. Check if we can at least identify the provider
  // generically (e.g. "infura.io" appears but didn't match a specific chain
  // pattern — could be a less common network we haven't mapped yet).
  const genericProviders: Record<string, string[]> = {
    infura: ["infura.io"],
    alchemy: ["alchemy.com", "alchemyapi.io"],
    quicknode: ["quiknode.pro"],
  };

  for (const [providerName, patterns] of Object.entries(genericProviders)) {
    for (const pattern of patterns) {
      if (haystack.includes(pattern)) {
        return {
          chain: DEFAULT_CHAIN,
          providerName,
          providerLabel: `${providerName[0].toUpperCase()}${providerName.slice(
            1
          )} (chain not recognised — showing Ethereum)`,
          matchedPattern: pattern,
        };
      }
    }
  }

  return null;
}

/**
 * Like detectChain, but returns every distinct chain found in the input
 * instead of stopping at the single best match. Built for real-world pastes
 * that contain multiple RPC URLs at once — e.g. a wagmi config listing 5
 * chains, or a .env file with one line per network.
 *
 * Deduplication strategy: matches are grouped by their starting position in
 * the input. Overlapping matches at/near the same position (e.g. a loose
 * "mainnet.infura.io" match inside a more specific
 * "arbitrum-mainnet.infura.io" match) keep only the longest pattern at that
 * position — same principle as detectChain's longest-match-wins, just
 * applied per-position instead of globally. After that, results are
 * deduplicated by chain id, since the same chain appearing twice (e.g. an
 * HTTP and a WSS URL for the same network) should surface once, not twice.
 */
export function detectAllChains(input: string): DetectionResult[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const haystack = trimmed.toLowerCase();
  const rawMatches = findAllMatches(haystack);
  if (rawMatches.length === 0) return [];

  // Sort by start position so overlap-resolution can scan left to right.
  rawMatches.sort((a, b) => a.index - b.index);

  const resolved: RawMatch[] = [];
  for (const match of rawMatches) {
    const matchEnd = match.index + match.matchedPattern.length;
    const overlapping = resolved.find((existing) => {
      const existingEnd = existing.index + existing.matchedPattern.length;
      return match.index < existingEnd && matchEnd > existing.index;
    });

    if (!overlapping) {
      resolved.push(match);
    } else if (match.matchedPattern.length > overlapping.matchedPattern.length) {
      // A longer, more specific pattern overlaps an existing weaker one —
      // replace it, same longest-match-wins principle as detectChain.
      const idx = resolved.indexOf(overlapping);
      resolved[idx] = match;
    }
    // else: existing match is already longer/equal — keep it, discard this one.
  }

  // Deduplicate by chain id, preserving first-seen order (left-to-right in
  // the original input), and convert to the public DetectionResult shape.
  const seenChainIds = new Set<string>();
  const results: DetectionResult[] = [];
  for (const match of resolved) {
    if (seenChainIds.has(match.chain.id)) continue;
    seenChainIds.add(match.chain.id);
    results.push({
      chain: match.chain,
      providerName: match.providerName,
      providerLabel: match.providerLabel,
      matchedPattern: match.matchedPattern,
    });
  }

  return results;
}

/**
 * Simple search across chain name / id, used by the Chain Explorer search box.
 */
export function searchChains(
  chains: ChainEntry[],
  query: string
): ChainEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return chains;
  return chains.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
  );
}
