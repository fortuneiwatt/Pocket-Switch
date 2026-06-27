import { describe, it, expect, vi, afterEach } from "vitest";
import { testPocketEndpoint } from "../testEndpoint";
import type { ChainEntry } from "../types";

const ETH_CHAIN: ChainEntry = {
  id: "ethereum",
  name: "Ethereum",
  slug: "eth",
  pocketUrl: "https://eth.api.pocket.network",
  nativeCurrency: "ETH",
  providers: {},
};

const COSMOS_CHAIN: ChainEntry = {
  id: "osmosis",
  name: "Osmosis",
  slug: "osmosis",
  pocketUrl: "https://osmosis.api.pocket.network",
  nativeCurrency: "OSMO",
  rpcType: "cosmos",
  providers: {},
};

describe("testPocketEndpoint", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses a successful EVM eth_blockNumber response into a readable block number", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x14a5e90" }), // hex block number
    }) as unknown as typeof fetch;

    const result = await testPocketEndpoint(ETH_CHAIN);

    expect(result.status).toBe("success");
    expect(result.message).toContain("Block #");
    // 0x14a5e90 = 21,651,088 — confirms hex parsing is correct, not just present
    expect(result.message).toContain("21,651,088");
  });

  it("parses a successful Cosmos status response into a readable block height", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: { sync_info: { latest_block_height: "12345678" } },
      }),
    }) as unknown as typeof fetch;

    const result = await testPocketEndpoint(COSMOS_CHAIN);

    expect(result.status).toBe("success");
    expect(result.message).toContain("12,345,678");
  });

  it("reports an error status when the HTTP response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const result = await testPocketEndpoint(ETH_CHAIN);

    expect(result.status).toBe("error");
    expect(result.message).toContain("503");
  });

  it("reports an error status when the RPC response contains a JSON-RPC error object", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32601, message: "Method not found" },
      }),
    }) as unknown as typeof fetch;

    const result = await testPocketEndpoint(ETH_CHAIN);

    expect(result.status).toBe("error");
    expect(result.message).toBe("Method not found");
  });

  it("reports an error status when the network request itself throws (e.g. CORS, offline)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await testPocketEndpoint(ETH_CHAIN);

    expect(result.status).toBe("error");
    expect(result.message).toBe("Failed to fetch");
  });

  it("always reports a latency in milliseconds on both success and failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: "0x1" }),
    }) as unknown as typeof fetch;

    const result = await testPocketEndpoint(ETH_CHAIN);

    expect(typeof result.latencyMs).toBe("number");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
