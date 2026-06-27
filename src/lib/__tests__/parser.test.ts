import { describe, it, expect } from "vitest";
import {
  detectChain,
  detectAllChains,
  replaceAllOccurrences,
  ALL_CHAINS,
  MAINNET_CHAINS,
} from "../parser";

describe("detectChain", () => {
  it("detects Ethereum from a raw Infura URL", () => {
    const result = detectChain("https://mainnet.infura.io/v3/abc123");
    expect(result?.chain.name).toBe("Ethereum");
    expect(result?.chain.pocketUrl).toBe("https://eth.api.pocket.network");
  });

  it("detects Ethereum from an Alchemy URL embedded in ethers.js code", () => {
    const snippet = `const provider = new JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/KEY")`;
    const result = detectChain(snippet);
    expect(result?.chain.name).toBe("Ethereum");
    expect(result?.providerName).toBe("alchemy");
  });

  it("detects Polygon from an Alchemy URL, not Ethereum", () => {
    const result = detectChain(
      "https://polygon-mainnet.g.alchemy.com/v2/somekey"
    );
    expect(result?.chain.name).toBe("Polygon");
  });

  it("detects Arbitrum from an Infura URL, not Ethereum", () => {
    const result = detectChain("https://arbitrum-mainnet.infura.io/v3/KEY");
    expect(result?.chain.name).toBe("Arbitrum");
  });

  // Regression test for the real bug found during coverage expansion:
  // Ethereum's old pattern ("mainnet.infura.io/v3/") was a substring of every
  // other Infura chain's URL (e.g. "arbitrum-mainnet.infura.io/v3/"), which
  // caused every other Infura chain to be misdetected as Ethereum under
  // first-match-wins logic. This test locks in the fix (longest-match-wins +
  // anchored Ethereum pattern) so it can't silently regress.
  it("does not misdetect other Infura chains as Ethereum (regression)", () => {
    const otherInfuraChains: [string, string][] = [
      ["https://arbitrum-mainnet.infura.io/v3/KEY", "Arbitrum"],
      ["https://avalanche-mainnet.infura.io/v3/KEY", "Avalanche (C-Chain)"],
      ["https://base-mainnet.infura.io/v3/KEY", "Base"],
      ["https://blast-mainnet.infura.io/v3/KEY", "Blast"],
      ["https://bsc-mainnet.infura.io/v3/KEY", "BNB Smart Chain"],
      ["https://celo-mainnet.infura.io/v3/KEY", "Celo"],
      ["https://linea-mainnet.infura.io/v3/KEY", "Linea"],
      ["https://mantle-mainnet.infura.io/v3/KEY", "Mantle"],
      ["https://opbnb-mainnet.infura.io/v3/KEY", "opBNB"],
      ["https://scroll-mainnet.infura.io/v3/KEY", "Scroll"],
      ["https://sei-mainnet.infura.io/v3/KEY", "Sei"],
      ["https://unichain-mainnet.infura.io/v3/KEY", "Unichain"],
      ["https://zksync-mainnet.infura.io/v3/KEY", "zkSync Era"],
    ];

    for (const [url, expectedChain] of otherInfuraChains) {
      const result = detectChain(url);
      expect(result?.chain.name, `Failed for URL: ${url}`).toBe(
        expectedChain
      );
      expect(result?.chain.name).not.toBe("Ethereum");
    }
  });

  // Regression test for a second real collision found while expanding Alchemy
  // coverage: "bnb-mainnet.g.alchemy.com/v2/" (BSC) was a literal substring of
  // "opbnb-mainnet.g.alchemy.com/v2/" (opBNB). Longest-match-wins happened to
  // save us here by luck (opBNB's pattern is longer), but relying on length
  // alone is fragile — so BSC's pattern was anchored with a protocol prefix
  // to make the two patterns unambiguous by construction, not by luck.
  it("does not misdetect opBNB Alchemy URLs as BNB Smart Chain (regression)", () => {
    const result = detectChain(
      "https://opbnb-mainnet.g.alchemy.com/v2/KEY"
    );
    expect(result?.chain.name).toBe("opBNB");
    expect(result?.chain.name).not.toBe("BNB Smart Chain");
  });

  it("detects newly added Alchemy chains correctly (Metis, Boba, Sonic, Ink, Hyperliquid, Tron, Gnosis, Moonbeam, Celo)", () => {
    const newAlchemyChains: [string, string][] = [
      ["https://metis-mainnet.g.alchemy.com/v2/KEY", "Metis"],
      ["https://boba-mainnet.g.alchemy.com/v2/KEY", "Boba Network"],
      ["https://sonic-mainnet.g.alchemy.com/v2/KEY", "Sonic"],
      ["https://ink-mainnet.g.alchemy.com/v2/KEY", "Ink"],
      ["https://hyperliquid-mainnet.g.alchemy.com/v2/KEY", "Hyperliquid"],
      ["https://tron-mainnet.g.alchemy.com/v2/KEY", "Tron"],
      ["https://gnosis-mainnet.g.alchemy.com/v2/KEY", "Gnosis"],
      ["https://moonbeam-mainnet.g.alchemy.com/v2/KEY", "Moonbeam"],
      ["https://celo-mainnet.g.alchemy.com/v2/KEY", "Celo"],
    ];

    for (const [url, expectedChain] of newAlchemyChains) {
      const result = detectChain(url);
      expect(result?.chain.name, `Failed for URL: ${url}`).toBe(
        expectedChain
      );
    }
  });

  it("returns null for input with no recognisable provider", () => {
    const result = detectChain("totally unrelated text with no rpc url");
    expect(result).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(detectChain("")).toBeNull();
    expect(detectChain("   ")).toBeNull();
  });

  it("falls back to a generic match when provider is known but chain pattern isn't", () => {
    // A made-up Infura-like host for a chain we have no specific pattern for
    const result = detectChain("https://made-up-chain.infura.io/v3/KEY");
    expect(result?.providerName).toBe("infura");
    expect(result?.chain.name).toBe("Ethereum"); // documented fallback behaviour
  });
});

describe("detectAllChains", () => {
  it("detects multiple distinct chains from a realistic multi-chain wagmi config", () => {
    const snippet = `
      export const config = createConfig({
        chains: [mainnet, polygon, arbitrum],
        transports: {
          [mainnet.id]: http("https://mainnet.infura.io/v3/KEY"),
          [polygon.id]: http("https://polygon-mainnet.g.alchemy.com/v2/KEY"),
          [arbitrum.id]: http("https://arbitrum-mainnet.infura.io/v3/KEY"),
        },
      });
    `;
    const results = detectAllChains(snippet);
    const chainNames = results.map((r) => r.chain.name).sort();

    expect(chainNames).toEqual(["Arbitrum", "Ethereum", "Polygon"]);
  });

  it("does not let a shorter overlapping pattern shadow a longer, more specific one (regression)", () => {
    // Same underlying bug class as the Ethereum/Arbitrum substring issue in
    // detectChain, but now checked in the multi-match context: every chain
    // in this batch should resolve correctly, not collapse into Ethereum.
    const snippet = `
      https://mainnet.infura.io/v3/KEY
      https://avalanche-mainnet.infura.io/v3/KEY
      https://base-mainnet.infura.io/v3/KEY
    `;
    const results = detectAllChains(snippet);
    const chainNames = results.map((r) => r.chain.name).sort();

    expect(chainNames).toEqual([
      "Avalanche (C-Chain)",
      "Base",
      "Ethereum",
    ]);
  });

  it("deduplicates the same chain appearing twice in the input", () => {
    const snippet = `
      const httpUrl = "https://mainnet.infura.io/v3/KEY";
      const wsUrl = "wss://mainnet.infura.io/ws/v3/KEY";
    `;
    const results = detectAllChains(snippet);

    expect(results).toHaveLength(1);
    expect(results[0].chain.name).toBe("Ethereum");
  });

  it("returns a single-item array when only one chain is present", () => {
    const results = detectAllChains(
      "https://polygon-mainnet.g.alchemy.com/v2/KEY"
    );
    expect(results).toHaveLength(1);
    expect(results[0].chain.name).toBe("Polygon");
  });

  it("returns an empty array for input with no recognisable provider", () => {
    expect(detectAllChains("totally unrelated text")).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(detectAllChains("")).toEqual([]);
    expect(detectAllChains("   ")).toEqual([]);
  });

  it("preserves left-to-right order of first appearance in the input", () => {
    const snippet = `
      https://polygon-mainnet.g.alchemy.com/v2/KEY
      https://mainnet.infura.io/v3/KEY
      https://arbitrum-mainnet.infura.io/v3/KEY
    `;
    const results = detectAllChains(snippet);
    const chainNames = results.map((r) => r.chain.name);

    expect(chainNames).toEqual(["Polygon", "Ethereum", "Arbitrum"]);
  });
});

describe("replaceAllOccurrences", () => {
  it("replaces a single URL with its Pocket equivalent and leaves everything else untouched", () => {
    const input = `const provider = new JsonRpcProvider("https://mainnet.infura.io/v3/abc123")`;
    const result = replaceAllOccurrences(input);

    expect(result.convertedContent).toBe(
      `const provider = new JsonRpcProvider("https://eth.api.pocket.network")`
    );
    expect(result.replacementCount).toBe(1);
    expect(result.chainsFound.map((c) => c.chain.name)).toEqual(["Ethereum"]);
  });

  it("replaces every chain in a realistic multi-chain wagmi config, preserving surrounding code exactly", () => {
    const input = `export const config = createConfig({
  chains: [mainnet, polygon, arbitrum],
  transports: {
    [mainnet.id]: http("https://mainnet.infura.io/v3/KEY"),
    [polygon.id]: http("https://polygon-mainnet.g.alchemy.com/v2/KEY"),
    [arbitrum.id]: http("https://arbitrum-mainnet.infura.io/v3/KEY"),
  },
});`;
    const result = replaceAllOccurrences(input);

    expect(result.convertedContent).toBe(`export const config = createConfig({
  chains: [mainnet, polygon, arbitrum],
  transports: {
    [mainnet.id]: http("https://eth.api.pocket.network"),
    [polygon.id]: http("https://poly.api.pocket.network"),
    [arbitrum.id]: http("https://arb-one.api.pocket.network"),
  },
});`);
    expect(result.replacementCount).toBe(3);
    expect(result.chainsFound.map((c) => c.chain.name).sort()).toEqual([
      "Arbitrum",
      "Ethereum",
      "Polygon",
    ]);
  });

  it("replaces every occurrence even when the same chain's URL repeats, and counts them all", () => {
    const input = `
PRIMARY_RPC=https://mainnet.infura.io/v3/KEY1
FALLBACK_RPC=https://mainnet.infura.io/v3/KEY2
    `;
    const result = replaceAllOccurrences(input);

    // Both lines should be replaced with the same Pocket URL...
    const occurrences = result.convertedContent.match(
      /https:\/\/eth\.api\.pocket\.network/g
    );
    expect(occurrences?.length).toBe(2);
    // ...but chainsFound reports Ethereum once, since it's a summary, not a log.
    expect(result.chainsFound.map((c) => c.chain.name)).toEqual(["Ethereum"]);
    // replacementCount, however, reflects the true number of replacements made.
    expect(result.replacementCount).toBe(2);
  });

  it("does not let a shorter overlapping pattern corrupt a longer, more specific replacement (regression)", () => {
    // Same bug class as detectChain's Ethereum/Arbitrum substring issue,
    // now checked against the actual string-splicing logic: if overlap
    // resolution were wrong here, the output URL would be mangled, not
    // just mis-labelled.
    const input = `https://avalanche-mainnet.infura.io/v3/KEY`;
    const result = replaceAllOccurrences(input);

    expect(result.convertedContent).toBe(
      "https://avax.api.pocket.network"
    );
    expect(result.chainsFound[0].chain.name).toBe("Avalanche (C-Chain)");
  });

  it("preserves unrelated surrounding text, comments, and formatting exactly", () => {
    const input = `# Production config — do not commit\nRPC_URL=https://mainnet.infura.io/v3/KEY # primary endpoint\nDEBUG=false`;
    const result = replaceAllOccurrences(input);

    expect(result.convertedContent).toBe(
      `# Production config — do not commit\nRPC_URL=https://eth.api.pocket.network # primary endpoint\nDEBUG=false`
    );
  });

  it("returns the original content unchanged when no provider is recognised", () => {
    const input = "DATABASE_URL=postgres://localhost:5432/mydb";
    const result = replaceAllOccurrences(input);

    expect(result.convertedContent).toBe(input);
    expect(result.replacementCount).toBe(0);
    expect(result.chainsFound).toEqual([]);
  });

  it("returns an empty result for empty input without throwing", () => {
    const result = replaceAllOccurrences("");
    expect(result.convertedContent).toBe("");
    expect(result.replacementCount).toBe(0);
  });

  it("correctly separates two different chains' URLs even when they sit on adjacent lines with no gap between the key and the next protocol", () => {
    // Stress-tests the full-URL expansion logic: if expansion over-reached
    // forward or backward, this would corrupt one or both replacements by
    // merging them or truncating one into the other.
    const input = `https://mainnet.infura.io/v3/KEY1
https://polygon-mainnet.g.alchemy.com/v2/KEY2`;
    const result = replaceAllOccurrences(input);

    expect(result.convertedContent).toBe(
      `https://eth.api.pocket.network
https://poly.api.pocket.network`
    );
    expect(result.replacementCount).toBe(2);
  });
});

describe("chains.json data integrity", () => {
  it("every chain has a valid pocketUrl pointing at *.api.pocket.network", () => {
    for (const chain of ALL_CHAINS) {
      expect(chain.pocketUrl).toMatch(/^https:\/\/[a-z0-9-]+\.api\.pocket\.network$/);
    }
  });

  it("every chain has a unique id", () => {
    const ids = ALL_CHAINS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no mainnet chain's provider pattern is a substring of another mainnet chain's pattern from the same provider", () => {
    // This directly guards against the class of bug we found: a short,
    // unanchored pattern silently shadowing other chains under the same
    // provider. We only check within the same provider since cross-provider
    // collisions aren't possible (different hostnames entirely).
    const byProvider: Record<string, { chainId: string; pattern: string }[]> =
      {};

    for (const chain of MAINNET_CHAINS) {
      for (const [providerName, providerData] of Object.entries(
        chain.providers
      )) {
        if (!byProvider[providerName]) byProvider[providerName] = [];
        for (const pattern of providerData.patterns) {
          byProvider[providerName].push({ chainId: chain.id, pattern });
        }
      }
    }

    const offenders: string[] = [];
    for (const [provider, entries] of Object.entries(byProvider)) {
      for (const a of entries) {
        for (const b of entries) {
          if (a.chainId === b.chainId) continue;
          if (b.pattern.toLowerCase().includes(a.pattern.toLowerCase())) {
            offenders.push(
              `[${provider}] "${a.pattern}" (${a.chainId}) is a substring of "${b.pattern}" (${b.chainId})`
            );
          }
        }
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
