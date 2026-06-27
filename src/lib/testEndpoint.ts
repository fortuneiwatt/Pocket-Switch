import type { ChainEntry } from "./types";

export type EndpointTestStatus = "idle" | "loading" | "success" | "error";

export interface EndpointTestResult {
  status: EndpointTestStatus;
  /** Human-readable result, e.g. "Block #21,483,991" or an error message */
  message?: string;
  /** Round-trip time in milliseconds, shown alongside a successful result */
  latencyMs?: number;
  /** Raw JSON-RPC result field, kept for anyone who wants to inspect it */
  raw?: unknown;
}

/**
 * Picks the right "cheap, universally-supported" JSON-RPC method to prove
 * an endpoint is alive, based on the chain's RPC family. We deliberately
 * avoid anything that could be mistaken for a write operation or anything
 * that needs an address/parameter — the point is a zero-config liveness
 * check, not a feature demo.
 */
function buildTestRequest(chain: ChainEntry): {
  body: string;
  parseResult: (json: unknown) => string;
} {
  const isEvm = !chain.rpcType || chain.rpcType === "evm";

  if (isEvm) {
    return {
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
      parseResult: (json: unknown) => {
        const result = (json as { result?: string })?.result;
        if (!result) throw new Error("No result field in response");
        const blockNumber = parseInt(result, 16);
        return `Block #${blockNumber.toLocaleString()}`;
      },
    };
  }

  if (chain.rpcType === "cosmos") {
    return {
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "status",
        params: [],
        id: 1,
      }),
      parseResult: (json: unknown) => {
        const height = (
          json as {
            result?: { sync_info?: { latest_block_height?: string } };
          }
        )?.result?.sync_info?.latest_block_height;
        if (!height) throw new Error("No block height in response");
        return `Block #${parseInt(height, 10).toLocaleString()}`;
      },
    };
  }

  // Solana and other non-EVM, non-Cosmos chains: getHealth/getSlot style
  // calls vary too much to guess generically and safely, so we fall back
  // to a basic Solana-style getSlot call, which is the most common case
  // in our "other" category today (Solana, Sui follow a similar pattern).
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getSlot",
      params: [],
      id: 1,
    }),
    parseResult: (json: unknown) => {
      const result = (json as { result?: number })?.result;
      if (result === undefined) throw new Error("No result field in response");
      return `Slot #${result.toLocaleString()}`;
    },
  };
}

/**
 * Fires a real, live request at the chain's actual Pocket Network endpoint
 * and reports back what came back, including round-trip latency. This is
 * intentionally the simplest possible liveness probe — its entire purpose
 * is to prove to a skeptical reader that the generated URL isn't just text,
 * it's a real endpoint answering real requests right now.
 */
export async function testPocketEndpoint(
  chain: ChainEntry
): Promise<EndpointTestResult> {
  const { body, parseResult } = buildTestRequest(chain);
  const start = performance.now();

  try {
    const response = await fetch(chain.pocketUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const latencyMs = Math.round(performance.now() - start);

    if (!response.ok) {
      return {
        status: "error",
        message: `Endpoint responded with HTTP ${response.status}`,
        latencyMs,
      };
    }

    const json = await response.json();

    if (json?.error) {
      const errMessage =
        typeof json.error === "string"
          ? json.error
          : json.error?.message ?? "Unknown RPC error";
      return { status: "error", message: errMessage, latencyMs, raw: json };
    }

    const message = parseResult(json);
    return { status: "success", message, latencyMs, raw: json };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const message =
      err instanceof Error
        ? err.message
        : "Network request failed (likely CORS or connectivity)";
    return { status: "error", message, latencyMs };
  }
}
