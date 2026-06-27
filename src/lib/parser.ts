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
 * Resolves raw matches down to one match per overlapping span, using the
 * same longest-match-wins principle as detectChain — but does NOT dedupe by
 * chain id. Multiple occurrences of the same chain's URL (e.g. Ethereum
 * appearing 3 times in a file) are all kept, since callers that need to do
 * a literal find-and-replace across a whole file need every occurrence, not
 * just one representative per chain.
 */
function resolveOverlaps(rawMatches: RawMatch[]): RawMatch[] {
  if (rawMatches.length === 0) return [];

  const sorted = [...rawMatches].sort((a, b) => a.index - b.index);
  const resolved: RawMatch[] = [];

  for (const match of sorted) {
    const matchEnd = match.index + match.matchedPattern.length;
    const overlapping = resolved.find((existing) => {
      const existingEnd = existing.index + existing.matchedPattern.length;
      return match.index < existingEnd && matchEnd > existing.index;
    });

    if (!overlapping) {
      resolved.push(match);
    } else if (match.matchedPattern.length > overlapping.matchedPattern.length) {
      const idx = resolved.indexOf(overlapping);
      resolved[idx] = match;
    }
    // else: existing match is already longer/equal — keep it, discard this one.
  }

  return resolved;
}

/**
 * Like detectChain, but returns every distinct chain found in the input
 * instead of stopping at the single best match. Built for real-world pastes
 * that contain multiple RPC URLs at once — e.g. a wagmi config listing 5
 * chains, or a .env file with one line per network.
 *
 * Deduplication strategy: overlapping matches are resolved first (see
 * resolveOverlaps), then results are deduplicated by chain id, since the
 * same chain appearing twice (e.g. an HTTP and a WSS URL for the same
 * network) should surface once in the UI, not twice.
 */
export function detectAllChains(input: string): DetectionResult[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const haystack = trimmed.toLowerCase();
  const rawMatches = findAllMatches(haystack);
  if (rawMatches.length === 0) return [];

  const resolved = resolveOverlaps(rawMatches);

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

export interface FileConversionResult {
  /** The original file content with every detected RPC URL replaced */
  convertedContent: string;
  /** Every distinct chain that was found and replaced, in first-seen order */
  chainsFound: DetectionResult[];
  /** Total number of individual URL occurrences replaced (may exceed chainsFound.length if a chain's URL repeats) */
  replacementCount: number;
}

/**
 * Detection patterns (in chains.json) are deliberately loose for matching
 * purposes — e.g. "avalanche-mainnet.infura.io/v3/" without a protocol
 * prefix, since that's all that's needed to confirm a chain is present.
 * But replacing just that substring would leave a stray "https://" before
 * the replacement and a stray API key fragment after it.
 *
 * This expands a raw match's span to cover the FULL url: backward to the
 * start of "http://" or "https://" if one immediately precedes the match
 * (allowing for a quote character in between, e.g. `"https://...`), and
 * forward through any trailing path/key characters until whitespace or a
 * closing quote/paren/comma is hit. The expanded span is what actually gets
 * sliced out and replaced — not the raw pattern match itself.
 */
function expandToFullUrl(
  original: string,
  matchIndex: number,
  matchLength: number
): { start: number; end: number } {
  let start = matchIndex;

  // Walk backward over the immediately-preceding characters looking for a
  // protocol prefix. We allow the pattern to already include it (some do),
  // in which case this is a no-op.
  const PROTOCOLS = ["https://", "http://"];
  for (const protocol of PROTOCOLS) {
    const candidateStart = matchIndex - protocol.length;
    if (
      candidateStart >= 0 &&
      original.slice(candidateStart, matchIndex).toLowerCase() === protocol
    ) {
      start = candidateStart;
      break;
    }
  }

  // Walk forward from the end of the raw match through any trailing
  // URL-safe characters (api keys, path segments) until we hit something
  // that clearly isn't part of a URL — whitespace, quote, closing paren,
  // comma, semicolon, or backtick.
  const STOP_CHARS = new Set([
    " ",
    "\t",
    "\n",
    "\r",
    '"',
    "'",
    "`",
    ")",
    ",",
    ";",
    "<",
    ">",
  ]);
  let end = matchIndex + matchLength;
  while (end < original.length && !STOP_CHARS.has(original[end])) {
    end++;
  }

  return { start, end };
}

/**
 * Takes a whole file's text content and returns a new version with every
 * detected Infura/Alchemy/QuickNode URL replaced by its Pocket Network
 * equivalent — everything else in the file (comments, unrelated code,
 * formatting) is left completely untouched.
 *
 * Implementation note: matching is done against a lowercased copy of the
 * input (so detection is case-insensitive, matching detectChain's
 * behaviour), but each raw match's span is first expanded to cover the full
 * URL (see expandToFullUrl) before slicing from the ORIGINAL string. This
 * matters because chains.json patterns are intentionally loose for
 * detection (e.g. missing the "https://" prefix or the trailing API key) —
 * replacing only the raw pattern would leave protocol/key fragments behind.
 */
export function replaceAllOccurrences(input: string): FileConversionResult {
  if (!input) {
    return { convertedContent: input, chainsFound: [], replacementCount: 0 };
  }

  const haystack = input.toLowerCase();
  const rawMatches = findAllMatches(haystack);
  if (rawMatches.length === 0) {
    return { convertedContent: input, chainsFound: [], replacementCount: 0 };
  }

  const resolved = resolveOverlaps(rawMatches).sort(
    (a, b) => a.index - b.index
  );

  // Expand every match to its full URL span before replacing.
  const expandedMatches = resolved.map((match) => {
    const { start, end } = expandToFullUrl(
      input,
      match.index,
      match.matchedPattern.length
    );
    return { ...match, expandedStart: start, expandedEnd: end };
  });

  // Build the replaced string by walking matches left to right, copying the
  // untouched gap before each match, then the replacement, then advancing
  // past the original (expanded) match. This avoids the classic bug of
  // replacing in place while indices shift — we build a new string instead
  // of mutating.
  let result = "";
  let cursor = 0;
  for (const match of expandedMatches) {
    result += input.slice(cursor, match.expandedStart);
    result += match.chain.pocketUrl;
    cursor = match.expandedEnd;
  }
  result += input.slice(cursor);

  // Distinct chains found, for the summary UI — same dedupe approach as
  // detectAllChains, but we still report the true replacementCount
  // separately so "Ethereum appeared 3 times" isn't lost information.
  const seenChainIds = new Set<string>();
  const chainsFound: DetectionResult[] = [];
  for (const match of resolved) {
    if (seenChainIds.has(match.chain.id)) continue;
    seenChainIds.add(match.chain.id);
    chainsFound.push({
      chain: match.chain,
      providerName: match.providerName,
      providerLabel: match.providerLabel,
      matchedPattern: match.matchedPattern,
    });
  }

  return {
    convertedContent: result,
    chainsFound,
    replacementCount: resolved.length,
  };
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
