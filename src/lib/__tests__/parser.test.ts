import { describe, it, expect } from "vitest";
import { detectChain, ALL_CHAINS, MAINNET_CHAINS } from "../parser";

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
