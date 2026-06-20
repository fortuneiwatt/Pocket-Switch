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

  let best: DetectionResult | null = null;
  let bestLength = 0;

  for (const chain of ALL_CHAINS) {
    for (const [providerName, providerData] of Object.entries(
      chain.providers
    )) {
      for (const pattern of providerData.patterns) {
        const lowerPattern = pattern.toLowerCase();
        if (
          haystack.includes(lowerPattern) &&
          lowerPattern.length > bestLength
        ) {
          bestLength = lowerPattern.length;
          best = {
            chain,
            providerName,
            providerLabel: providerData.label,
            matchedPattern: pattern,
          };
        }
      }
    }
  }

  if (best) return best;

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
